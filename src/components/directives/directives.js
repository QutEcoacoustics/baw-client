var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);


bawds.directive('bawRecordInformation', function () {

    return {
        restrict: 'AE',
        scope: false,
        /* priority: ???  */
//            controller: 'RecordInformationCtrl',
        /* require: ??? */
        /*template: "<div></div>",*/
        templateUrl: "/assets/record_information.html",
        replace: false,
        /*compile: function(tElement, tAttrs, transclude) {

         },*/
        link: function (scope, iElement, iAttrs, controller) {
            scope.name = scope[iAttrs.ngModel];


        }

    };
});

bawds.directive('bawDebugInfo', function () {
    return {
        restrict: 'AE',
        replace: true,
        template: '<div><a href ng-click="showOrHideDebugInfo= !showOrHideDebugInfo">Debug info {{showOrHideDebugInfo}}</a><pre ui-toggle="showOrHideDebugInfo" class="ui-hide"  ng-bind="print()"></pre></div>',
        link: function (scope, element, attrs) {
            if (!scope.print) {
                //console.warn("baw-debug-info missing parent scope, no print function");
                scope.print = bawApp.print;
            }
        }
    };
});

bawds.directive('bawJsonBinding', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attr, ngModel) {

            function catchParseErrors(viewValue) {
                var result;
                try {
                    result = angular.fromJson(viewValue);
                } catch (e) {
                    ngModel.$setValidity('bawJsonBinding', false);
                    return '';
                }
                ngModel.$setValidity('bawJsonBinding', true);
                return result;
            }

            ngModel.$parsers.push(catchParseErrors);
            ngModel.$formatters.push(angular.toJson);
        }
    };
});

// ensures formatters are run on input blur
bawds.directive('renderOnBlur', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, elm, attrs, ctrl) {
            elm.bind('blur', function () {
                var viewValue = ctrl.$modelValue;
                for (var i in ctrl.$formatters) {
                    viewValue = ctrl.$formatters[i](viewValue);
                }
                ctrl.$viewValue = viewValue;
                ctrl.$render();
            });
        }
    };
});


bawds.directive('isGuid', function () {
    return {

        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            var isList = typeof attrs.ngList !== "undefined";

            // push rather than unshift... we want to test last
            ctrl.$parsers.push(function (viewValue) {
                var valid = true;
                if (isList) {
                    for (var i = 0; i < viewValue.length && valid; i++) {
                        valid = baw.GUID_REGEXP.test(viewValue[i]);
                    }
                }
                else {
                    valid = baw.GUID_REGEXP.test(viewValue);
                }

                if (valid) {
                    // it is valid
                    ctrl.$setValidity('isGuid', true);
                    return viewValue;
                } else {
                    // it is invalid, return undefined (no model update)
                    ctrl.$setValidity('isGuid', false);
                    return undefined;
                }
            });
        }
    };
});

// implements infinite scrolling
// http://jsfiddle.net/vojtajina/U7Bz9/
bawds.directive('whenScrolled', function () {
    return function (scope, elm, attr) {
        var raw = elm[0];

        elm.bind('scroll', function () {
            console.log('scrolled');
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attr.whenScrolled);
            }
        });
    };
});


/**
 * A cross record element checker
 */
bawds.directive('bawChecked', ['$parse', function ($parse) {

    // a cache of elements for each radio group
    var library = {};


    return {
        restrict: 'A',
        link: function radioInputType(scope, element, attr) {
            // make the name unique, if not defined
            if (baw.angularCopies.isUndefined(attr.name)) {
                element.attr('name', Number.Unique());
            }

            var getter = $parse(attr.bawChecked);
            var assigner = getter.assign;

            // store elements from same group to enable mass updates
            library[attr.name] = library[attr.name] || [];
            library[attr.name].push({e: element, s: scope, g: getter, a: assigner});


            // forward binding from model
            // aggressively updates all elements
            scope.$watch(getter, function (newValue, oldValue) {
                if (newValue) {
                    // if a true value is set, aggressively set others to false
                    angular.forEach(library[attr.name], function (libraryItem) {
                        if (libraryItem.e === element) {
                            libraryItem.e[0].checked = true;
                        } else {
                            libraryItem.e[0].checked = false;
                            libraryItem.a(libraryItem.s, false);
                        }
                    });
                }
                else {
                    // if it's false, just make sure it is checked right (don't perpetuate the loop)
                    element[0].checked = false;
                }
            });

            // reverse bindings, elements to model
            function updateModel(event) {
                var isChecked = event.target.checked;

                var newest = library[attr.name][library[attr.name].length - 1];
                // STUPID ARSE HACK... for some reason the latest item although selected does not properly update
                // the 'last' value on the watch. so when it is first set to false nothing happens.
                // therefore *force* a change here by doing a separate apply with a bullshit value
                scope.$apply(function () {
                    newest.a(newest.s, null);
                });

                scope.$apply(function () {
                    assigner(scope, isChecked);

                    if (newest.e[0] != event.target) {
                        newest.a(newest.s, !isChecked);
                    }
                });

            }

            element.bind('click', updateModel);

        }
    };
}]);


/**
 * A directive for binding the position of an element to the model.
 * The binding uses translate transforms.
 *
 * ONLY one way binding supported at the moment
 */
bawds.directive('bawTranslateX', function () {

    var transformSupport = Modernizr.csstransforms;
    var transformProperty = 'left';
    if (transformSupport) {
        transformProperty = Modernizr.prefixed('transform');
    }


    return {
        restrict: 'A',
        link: function (scope, elements, attributes, controller) {
            var element = elements[0];

            scope.$watch(attributes.bawTranslateX, function (newValue, oldValue) {
                if (transformSupport) {
                    element.style[transformProperty] = 'translateX(' + newValue.toFixed(3) + 'px)';
                }
                else {
                    element.style[transformProperty] = '' + newValue.toFixed(3) + 'px';
                }
            });
        }
    };
});

bawds.directive('bawImageLoaded', ['$timeout', '$parse', function ($timeout, $parse) {
    return {
        restrict: 'A',
        link: function (scope, elements, attr) {
            var element = elements[0];
            if (element.nodeName !== "IMG") {
                throw 'Cannot put ngAudio element on an element that is not a <audio />';
            }

            var getter = $parse(attr.bawImageLoaded);
            var assigner = getter.assign;

            assigner(scope, element.complete);

            element.onload = function () {
                assigner(scope, element.complete);
            };

            function checkLater() {
                $timeout(function () {
                    assigner(scope, element.complete);

                    //if (element.complete) {
                    checkLater();
                    //}
                }, 1000);
            }

        }
    };
}]);

bawds.directive('bawInjectTransformers', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        priority: -1,
        link: function (scope, element, attr, ngModel) {
            var local = scope.$eval(attr.bawInjectTransformers);

            if (!angular.isObject(local) || !angular.isFunction(local.fromModel) || !angular.isFunction(local.fromElement)) {
                throw "The bawInjectTransformers must be bound to an object with two functions (`fromModel` and `fromElement`)";
            }

            ngModel.$parsers.push(local.fromElement);
            ngModel.$formatters.push(local.fromModel);
        }
    };
});

/*bawds.directive('bawMediaPlayer', function () {
 return {
 restrict: 'EA',
 template: '<div></div>',
 link: function (scope, element, attrs) {
 var $control = element,
 $player = $control.children('div'),
 cls = 'pause';

 var updatePlayer = function () {
 $player.jPlayer({
 // Flash fallback for outdated browser not supporting HTML5 audio/video tags
 // http://jplayer.org/download/
 swfPath: 'assets/',
 supplied: 'mp3,oga,webma',
 nativeSupport: true,
 oggSupport: true,
 solution: 'html, flash',
 preload: 'auto',
 wmode: 'window',
 ready: function () {
 $player
 .jPlayer("setMedia", {
 mp3: attrs.audiomp3,
 oga: attrs.audiooga,
 webma: attrs.audiowebma
 })
 .jPlayer(attrs.autoplay === 'true' ? 'play' : 'stop');
 },
 play: function () {
 $control.addClass(cls);

 if (attrs.pauseothers === 'true') {
 $player.jPlayer('pauseOthers');
 }
 },
 pause: function () {
 $control.removeClass(cls);
 },
 stop: function () {
 $control.removeClass(cls);
 },
 ended: function () {
 $control.removeClass(cls);
 }
 })
 .end()
 .unbind('click').click(function (e) {
 $player.jPlayer($control.hasClass(cls) ? 'stop' : 'play');
 });
 };

 scope.$watch(attrs.audio, updatePlayer);
 updatePlayer();
 }
 };
 });*/





