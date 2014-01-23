var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);

bawds.directive("ngSlider", function () {
    return {
        restrict: 'A',
        link: function (scope, $element, attrs) {
            var element = $element[0];

            var last = null;
            var updateScope = function () {
                if (element.value === last) {
                    return;
                }

                console.debug("ngSlider:updateScope: Calling apply!", element.value);
                
                scope.$apply(function () {
                    scope[attrs.ngSlider] = element.value;
                });
            };

            // IE does not use the input event like other browsers
            // so bind to both and try and drop events by checking for unnecessary change events
            element.addEventListener("change", updateScope);
            element.addEventListener("input", updateScope);

            scope.$watch(function () {
                return scope[attrs.ngSlider];
            }, function (newValue) {
                element.value = last = newValue;
            });


        }
    };
});