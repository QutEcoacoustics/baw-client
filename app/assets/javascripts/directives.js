bawApp.directive('baw', function() {
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