(function () {
    var bawds = angular.module('bawApp.directives', []);

    bawds.directive('addRedBox', function () {
        return function (scope, element, attrs) {
            element.append("<div style='background-color: red; height: 100px; width: 100px'></div>");
        }
    });

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

        }
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
        }
    });

    bawds.directive('bawJsonBinding', function () {



        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attr, ngModel) {

                function catchParseErrors(viewValue){
                    try{
                        var result = angular.fromJson(viewValue);
                    }catch(e){
                        ngModel.$setValidity('bawJsonBinding',false);
                        return '';
                    }
                    ngModel.$setValidity('bawJsonBinding',true);
                    return result;
                }

                ngModel.$parsers.push(catchParseErrors);
                ngModel.$formatters.push(angular.toJson)
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
                            valid = GUID_REGEXP.test(viewValue[i]);
                        }
                    }
                    else {
                        valid = GUID_REGEXP.test(viewValue);
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


    bawds.directive('bawAnnotationViewer', function () {

        var converters = function () {
            // TODO: these are stubs and will need to be refactored

            // constants go here

            return {
                pixelsToSeconds: function pixelsToSeconds(value) {
                    return value;
                },
                pixelsToHertz: function pixelsToHertz(value) {
                    return value;
                },
                secondsToPixels: function secondsToPixels(value) {
                    return value;
                },
                hertzToPixels: function hertzToPixels(value) {
                    return value;
                }
            };
        };

        function resizeOrMove(audioEvent, box) {

            if (audioEvent.__temporaryId__ === box.id) {
                audioEvent.startTimeSeconds =  box.left || 0;
                audioEvent.highFrequencyHertz = box.top || 0;
                //b.width = box.width;
                //b.height = box.height;
                audioEvent.endTimeSeconds = (audioEvent.startTimeSeconds + box.width) || 0;
                audioEvent.lowFrequencyHertz = (audioEvent.highFrequencyHertz + box.height) || 0;
            }
            else {
                console.error("Box ids do not match on resizing  or move event", audioEvent.__temporaryId__ , box.id);
            }
        }
        function resizeOrMoveWithApply(scope, audioEvent, box) {
            scope.$apply(function() {
                resizeOrMove(audioEvent, box);
            })
        }

        function touchUpdatedField(audioEvent) {
            audioEvent.updatedAt = new Date();
        }

        function create(simpleBox, audioRecordingId) {
            var now = new Date();
            var audioEvent = {
                __temporaryId__: simpleBox.id,
                audioRecordingId: audioRecordingId,

                createdAt: now,
                updatedAt: now,

                endTimeSeconds: 0.0,
                highFrequencyHertz: 0.0,
                isReference: false,
                lowFrequencyHertz: 0.0,
                startTimeSeconds: 0.0,
                audioEventTags: []
            };

            resizeOrMove(audioEvent, simpleBox);
            touchUpdatedField(audioEvent);

            return audioEvent;
        }

        return {
            restrict: 'AE',
            scope: {
                model: '=model'
            },
            controller: AnnotationViewerCtrl,
            require: '', // ngModel?
            templateUrl: '/assets/annotation_viewer.html',
//            compile: function(element, attributes, transclude)  {
//                // transform DOM
//            },
            link: function (scope, element, attributes, controller) {


                var $element = $(element);
                // assign a unique id to scope
                scope.id = Number.Unique();

                scope.$canvas = $element.find(".annotation-viewer img + div").first();

                // init drawabox
                // we use hash (POJO) because most of our operations involve lookups
                scope.model.audioEvents = scope.model.audioEvents || {};
                // store only the ids in this array (again for speed)
                scope.model.selectedAudioEvents = scope.model.selectedAudioEvents || [];


                scope.$canvas.drawabox({
                    "newBox": function (element, newBox) {
                        var newAudioEvent = create(newBox, "a dummy id!");

                        scope.$apply(function() {
                            scope.model.audioEvents[newAudioEvent.__temporaryId__] = newAudioEvent;
                            console.log("newBox", newBox, newAudioEvent);
                        });
                    },
                    "boxSelected": function (element, selectedBox) {
                        console.log("boxSelected", selectedBox);

                        //var audioEvent = _.find(scope.model.audioEvents, function(value) { return value.__temporaryId__ === selectedBox.id});

                        // support for multiple selections - remove the clear
                        scope.model.selectedAudioEvents.length = 0;
                        scope.model.selectedAudioEvents.push(selectedBox.id);
                    },
                    "boxResizing": function (element, box) {
                        console.log("boxResizing");
                        resizeOrMoveWithApply(scope, scope.model.audioEvents[box.id], box);

                    },
                    "boxResized": function (element, box) {
                        console.log("boxResized");
                        resizeOrMoveWithApply(scope, scope.model.audioEvents[box.id], box);
                    },
                    "boxMoving": function (element, box) {
                        console.log("boxMoving");
                        resizeOrMoveWithApply(scope, scope.model.audioEvents[box.id], box);
                    },
                    "boxMoved": function (element, box) {
                        console.log("boxMoved");
                        resizeOrMoveWithApply(scope, scope.model.audioEvents[box.id], box);
                    },
                    "boxDeleted": function (element, deletedBox) {
                        console.log("boxDeleted");

                        scope.$apply(function(){
                            // TODO: is this done by reference? does it even work?;
                            _(scope.model.audioEvents).reject(function (item) {
                                return item.id === deletedBox.id;
                            });
                            _(scope.model.selectedAudioEvents).reject(function (item) {
                                return item.id === deletedBox.id;
                            });
                        });


                    }
                });


            }
        }
    });


})();

//bawApp.directive('nsDsFade', function() {
//    return function(scope, element, attrs) {
//        element.css('display', 'none');
//        scope.$watch(attrs.ngDsFade, function(value) {
//           if (value) {
//               element.fadeIn(200);
//           }
//           else {
//               element.fadeOut(100);
//           }
//        });
//    }
//
//});
//

