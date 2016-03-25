class BreadcrumbsController {
    constructor($scope, $resource, $route, $routeParams, $location) {
        //this.$location = $location;
        //this.$route = $route;
    }
}


angular
    .module("bawApp.navigation.breadcrumbs", [])
    .controller(
        "BreadcrumbsController",
        [
            "$scope",
            "$resource",
            "$route",
            "$routeParams",
            "$location",
            BreadcrumbsController
        ])
    .component("breadcrumbs",
        {
            bindings: {
                crumbs: "<"
            },
            controller: "BreadcrumbsController",
            templateUrl: ["conf.paths", function (paths) {
                return paths.site.files.navigation.crumbs;
            }]
        });
