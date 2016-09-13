
angular
    .module("bawApp.scripts.widgets.show", [])
    .component("showScript", {
        bindings: {
            script: "=bawScript"
        },
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.scripts.show;
        }]
    });

