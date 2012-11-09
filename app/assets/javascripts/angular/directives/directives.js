
// HACK: this is a very bad way to do this!
bawApp.directive('nsDsFade', function() {
    return function(scope, element, attrs) {
        element.css('display', 'none');
        scope.$watch(attrs.ngDsFade, function(value) {
           if (value) {
               element.fadeIn(200);
           }
           else {
               element.fadeOut(100);
           }
        });
    }

});
//    .directive('uiToggle', [function() {
//    return function(scope, elm, attrs) {
//        scope.$watch(attrs.uiToggle, function(newVal, oldVal){
//            if (newVal) {
//                elm.removeClass('ui-hide').addClass('ui-show');
//            } else {
//                elm.removeClass('ui-show').addClass('ui-hide');
//            }
//        });
//    }
//}]);