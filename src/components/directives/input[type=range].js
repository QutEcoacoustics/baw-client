var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);

bawds.directive("ngSlider", function () {
    return {
        restrict: 'A',
        link: function (scope, $element, attrs) {
            var element = $element[0];

            var updateScope = function () {
                scope.$apply(function () {
                    scope[attrs.ngSlider] = element.value;
                });
            };

            $element.bind("change", updateScope);

            scope.$watch(function () {
                return scope[attrs.ngSlider];
            }, function (newValue) {
                element.value = newValue;
            });


        }
    };
});