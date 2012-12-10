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

                ngModel.$parsers.push(angular.fromJson);
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

                scope.$canvas = $($element.find(".annotation-viewer img + div")[0]);

                // init drawabox
                scope.model.audio_events = scope.model.audio_events || [];
                scope.model.selectedEvents = scope.model.selectedEvents || [];

                scope.$canvas.drawabox({
                    "newBox": function(){
                        console.log("newBox");
                    },
                    "boxSelected": function(){
                        console.log("boxSelected")
                    },
                    "boxResizing": function(){
                        console.log("boxResizing")
                    },
                    "boxResized": function(){
                        console.log("boxResized")
                    },
                    "boxMoving": function(){
                        console.log("boxMoving")}
                    ,
                    "boxMoved": function(){
                        console.log("boxMoved")
                    },
                    "boxDeleted": function(){
                        console.log("boxDeleted")
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

