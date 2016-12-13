angular
    .module("bawApp.directives.others", [ ])
    .directive("bawRecordInformation", function () {

        return {
            restrict: "AE",
            scope: false,
            templateUrl: "/assets/record_information.html",
            replace: false,
            link: function (scope, iElement, iAttrs, controller) {
                scope.name = scope[iAttrs.ngModel];


            }

        };
    })
    .directive("bawJsonBinding", function () {
        return {
            restrict: "A",
            require: "ngModel",
            link: function (scope, element, attr, ngModel) {

                function catchParseErrors(viewValue) {
                    var result;
                    try {
                        result = angular.fromJson(viewValue);
                    } catch (e) {
                        ngModel.$setValidity("bawJsonBinding", false);
                        return "";
                    }
                    ngModel.$setValidity("bawJsonBinding", true);
                    return result;
                }

                ngModel.$parsers.push(catchParseErrors);
                ngModel.$formatters.push(angular.toJson);
            }
        };
    })
    // ensures formatters are run on input blur
    .directive("renderOnBlur", function () {
        return {
            require: "ngModel",
            restrict: "A",
            link: function (scope, elm, attrs, ctrl) {
                elm.bind("blur", function () {
                    var viewValue = ctrl.$modelValue;
                    for (var i in ctrl.$formatters) { // jshint ignore:line
                        viewValue = ctrl.$formatters[i](viewValue);
                    }
                    ctrl.$viewValue = viewValue;
                    ctrl.$render();
                });
            }
        };
    })
    .directive("isGuid", function () {
        return {

            require: "ngModel",
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
                        ctrl.$setValidity("isGuid", true);
                        return viewValue;
                    } else {
                        // it is invalid, return undefined (no model update)
                        ctrl.$setValidity("isGuid", false);
                        return undefined;
                    }
                });
            }
        };
    })
    // implements infinite scrolling
    // http://jsfiddle.net/vojtajina/U7Bz9/
    .directive("whenScrolled", function () {
        return function (scope, elm, attr) {
            var raw = elm[0];

            elm.bind("scroll", function () {
                console.log("scrolled");
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled);
                }
            });
        };
    })
    /**
     * A cross record element checker
     */
    .directive("bawChecked", ["$parse", function ($parse) {

        // a cache of elements for each radio group
        var library = {};


        return {
            restrict: "A",
            link: function radioInputType(scope, element, attr) {
                // make the name unique, if not defined
                if (baw.angularCopies.isUndefined(attr.name)) {
                    element.attr("name", Number.Unique());
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

                        if (newest.e[0] !== event.target) {
                            newest.a(newest.s, !isChecked);
                        }
                    });

                }

                element.bind("click", updateModel);

            }
        };
    }])
    /**
     * A directive for binding the position of an element to the model.
     * The binding uses translate transforms.
     *
     * ONLY one way binding supported at the moment
     */
    .directive("bawTranslateX", function () {

        function getSupportedTransform() {
            var prefixes = "transform WebkitTransform MozTransform OTransform msTransform".split(" ");
            var div = document.createElement("div");
            for(var i = 0; i < prefixes.length; i++) {
                if(div && div.style[prefixes[i]] !== undefined) {
                    return prefixes[i];
                }
            }
            return false;
        }

        var transformProperty = getSupportedTransform();
        if (!transformProperty) {
            transformProperty = "left";
        }

        return {
            restrict: "A",
            link: function (scope, elements, attributes, controller) {
                var element = elements[0];

                function leftWatcher(newValue, oldValue) {
                    element.style[transformProperty] = "" + translateValue(newValue);
                }

                function transformWatcher(newValue, oldValue) {
                    element.style[transformProperty] = "translate3d(" + translateValue(newValue) + ", 0, 0)";
                }

                /**
                 * allows val to be either string with desired units (px or %) or number,
                 * in which case defaults to px
                 * @param val
                 * @returns string
                 */
                function translateValue (val) {

                    if (typeof(val) === "number") {
                        return val.toFixed(3) + "px";
                    } else {
                        return val;
                    }

                }

                var watcher = getSupportedTransform() ? transformWatcher : leftWatcher;

                scope.$watch(attributes.bawTranslateX, watcher);
            }
        };
    })

    .directive("bawImageLoaded", ["$timeout", "$parse", function ($timeout, $parse) {
        return {
            restrict: "A",
            link: function (scope, elements, attr) {
                var element = elements[0];
                if (element.nodeName !== "IMG") {
                    throw "Cannot put bawImageLoaded element on an element that is not a <image />";
                }

                var getter = $parse(attr.bawImageLoaded);
                var assigner = getter.assign;

                assigner(scope, element.complete);

                element.onload = function () {
                    assigner(scope, element.complete);
                };
                /*
                 function checkLater() {
                 $timeout(function () {
                 assigner(scope, element.complete);

                 //if (element.complete) {
                 checkLater();
                 //}
                 }, 1000);
                 }*/

            }
        };
    }])
    .directive("bawInjectTransformers", function () {
        return {
            restrict: "A",
            require: "ngModel",
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







