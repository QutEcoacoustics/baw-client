angular.module('bawApp.birdWalks', [])
    .controller('BirdWalksCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'BirdWalkService', 'conf.paths',
        function BirdWalksCtrl($scope, $resource, $routeParams, $route, $http, BirdWalkService, paths) {
            // set up results
            $scope.results = {
                allowContact: true,
                consented: false,
                ethicsStatementViewed: false,
                pageHit: (new Date()).toISOString()
            };

            $scope.imagesPath = paths.site.files.birdWalk.images;

            // download bird walk specification
            BirdWalkService.getUrl(paths.site.files.birdWalk.spec, 'birdWalkSpec', $scope);
        }])
    .controller('BirdWalkCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'BirdWalkService', 'conf.paths',
        function BirdWalkCtrl($scope, $resource, $routeParams, $route, $http, BirdWalkService, paths) {
            $scope.imagesPath = paths.site.files.birdWalk.images;
            BirdWalkService.getUrl(paths.site.files.birdWalk.spec, 'birdWalkSpec', $scope);
            $scope.params = $routeParams;

            //$scope.spec.birdWalkSpec.walks
        }]);