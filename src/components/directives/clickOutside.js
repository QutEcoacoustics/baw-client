angular
    .module("bawApp.directives.clickOutside", [])
    .directive("clickOutside", ["$document", function ($document) {
        return {
            link: function postLink(scope, element, attrs) {
                var onClick = function (event) {
                    var isChild = element[0].contains(event.target);
                    var isSelf = element[0] === event.target;
                    var isInside = isChild || isSelf;
                    if (!isInside) {
                        console.log("is outside !!!!!!!");
                        scope.$apply(attrs.clickOutside);
                    }
                };

                $document.bind("click", onClick);

            }
        };
    }]);
