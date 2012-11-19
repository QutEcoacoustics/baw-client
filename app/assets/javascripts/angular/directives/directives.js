
(function() {
    var bawds = angular.module('bawApp.directives', []);

    bawds.directive('addRedBox', function() {
        return function(scope, element, attrs){
            element.append("<div style='background-color: red; height: 100px; width: 100px'></div>");
        }
    });

    bawds.directive('bawRecordInformation', function(){

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
            link: function(scope, iElement, iAttrs, controller) {
                scope.name = scope[iAttrs.ngModel];


            }

        }
    });

    bawds.directive('bawDebugInfo', function() {
        return {
            restrict: 'AE',
            replace: true,
            template: '<div><a href ng-click="showOrHideDebugInfo= !showOrHideDebugInfo">Debug info {{showOrHideDebugInfo}}</a><pre ui-toggle="showOrHideDebugInfo" class="ui-hide"  ng-bind="print()"></pre></div>',
            link: function(scope, element, attrs) {

            }
        }
    });

    bawds.directive('bawJsonBinding', function() {

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {

                ngModel.$parsers.push(angular.fromJson);
                ngModel.$formatters.push(angular.toJson)
            }
        };
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

