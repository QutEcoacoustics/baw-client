
(function() {
    var bads = angular.module('bawApp.directives', []);

    bads.directive('addRedBox', function() {
        return function(scope, element, attrs){
            element.append("<div style='background-color: red; height: 100px; width: 100px'></div>");
        }
    });

    bads.directive('recordInformation', function(){
        return {
            restrict: 'AE',
            /*scope: false,*/
            /* priority: ???  */
            /* controller: ??? */
            /* require: ??? */
            /*template: "<div></div>",*/
            templateUrl: "/assets/record_information.html"
            /*replace: false*/
            /*compile: function(tElement, tAttrs, transclude) {

            },*/
            /*link: function(scope, iElement, iAttrs, controller) {

            }       */

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

