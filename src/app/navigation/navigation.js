angular.module("bawApp.navigation", [])

    .directive("navigation", ["conf.paths", function (paths) {

        return {
            restrict: "E",
            templateUrl: paths.site.files.navigation
        };
    }])

    .controller(
        "NavigationCtrl",
        ["$scope", "$resource", "$route", "$routeParams", "$location", "breadcrumbs",
            function NavigationCtrl($scope, $resource, $route, $routeParams, $location, breadcrumbs) {
                $scope.$location = $location;
                $scope.$route = $route;
                $scope.breadcrumbs = breadcrumbs;
            }
        ]);