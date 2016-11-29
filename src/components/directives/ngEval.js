angular
    .module("bawApp.directives.ngEval", [])
    .directive("ngEval", function () {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {

                // HACK: this is a horrible, horrible way to do this!
                // Watcher methods should be idempotent - eval is meant to cause side effects
                scope.$watch(attrs.ngEval, function () {
                });
            }
        };
    });