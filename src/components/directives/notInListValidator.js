angular
    .module("bawApp.directives.notInListValidator", [])
    .directive("notInList", function() {
        return {
            require: "ngModel",
            scope: {
                notInList: "<"
            },
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$validators.notInList = function(modelValue, viewValue) {
                    if (ctrl.$isEmpty(modelValue)) {
                        // consider empty models to be valid
                        return true;
                    }

                    var list = scope.notInList || [];

                    // if not in list, return true for valid
                    return list.indexOf(viewValue) === -1;
                };
            }
        };
    });
