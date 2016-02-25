// attempts to hack a solution together for:
// https://github.com/angular/angular.js/issues/10071
// and
// https://github.com/angular/angular.js/pull/11023
// code in this module based on http://stackoverflow.com/questions/25818757/set-angularjs-nested-forms-to-submitted
angular.module(
    "bawApp.directives.formChildrenHack",
    [])
    .directive("form", function () {
        return {
            restrict: "E",
            require: "form",
            link: function (scope, elem, attrs, formCtrl) {
                //console.debug("formChildrenHack::form::link: Link function run");

                scope.$watch(function () {
                    return formCtrl.$submitted;
                }, function (submitted) {
                    //console.debug("formChildrenHack::form::submittedWatch: submit triggered");
                    if (submitted) {
                        scope.$broadcast("$submitted");
                    }
                });
            }
        };
    })

    .directive("ngForm", function () {
        return {
            restrict: "EA",
            require: "form",
            link: function (scope, elem, attrs, formCtrl) {
                //console.debug("formChildrenHack::ngForm::link: Link function run");

                scope.$on("$submitted", function () {
                    console.debug("formChildrenHack::ngForm::submittedListener: setting submitted", scope);
                    formCtrl.$setSubmitted();
                });
            }
        };
    });