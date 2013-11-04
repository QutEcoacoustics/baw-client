angular.module('bawApp.navigation', [])

    .directive('navigation', ['conf.paths', function (paths) {

        return {
            restrict: 'E',
            templateUrl: paths.site.files.navigation
    };
    }])

    .controller(
        'NavigationCtrl',
        ['$scope', '$resource', '$routeParams',
            /**
             * The navigation controller. Here we setup breadcrumbs.
             * @param $scope
             * @param $resource
             * @constructor
             * @param $routeParams
             */
                function NavigationCtrl($scope, $resource, $routeParams) {

            }
        ]);