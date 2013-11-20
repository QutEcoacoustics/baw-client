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

            $scope.imagesPath = paths.site.files.birdWalk.imagesAbsolute;

            // download bird walk specification
            BirdWalkService.getUrl(paths.site.files.birdWalk.specAbsolute, 'birdWalkSpec', $scope, null);
            BirdWalkService.getUrl(paths.site.files.birdWalk.statsAbsolute, 'birdWalkStats', $scope, null);
        }])
    .controller('BirdWalkCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'BirdWalkService', 'conf.paths',
        function BirdWalkCtrl($scope, $resource, $routeParams, $route, $http, BirdWalkService, paths) {

            // constants
            var CURRENT_LOCATION_ZOOM = 4;

            // initialise
            $scope.imagesPath = paths.site.files.birdWalk.imagesAbsolute;
            $scope.params = $routeParams;
            BirdWalkService.getUrl(paths.site.files.birdWalk.statsAbsolute, 'birdWalkStats', $scope, null);
            BirdWalkService.getUrl(paths.site.files.birdWalk.specAbsolute, 'birdWalkSpec', $scope, function () {
                // set up page display
                $scope.details = $scope.spec.birdWalkSpec.walks[$scope.params.birdWalkId];
                var overviewLocation = new google.maps.LatLng(
                    $scope.details.overviewLocation.latitude,
                    $scope.details.overviewLocation.longitude);

                $scope.locationMap = $scope.createMap('locationMap', overviewLocation, CURRENT_LOCATION_ZOOM);
                google.maps.event.trigger($scope.locationMap, 'resize');
            });


            //$scope.spec.birdWalkSpec.walks

            $scope.createMap = function (elementId, LatLng, zoom) {
                return new google.maps.Map(
                    document.getElementById(elementId),
                    {
                        center: LatLng,
                        zoom: zoom,
                        mapTypeId: google.maps.MapTypeId.HYBRID
                    }
                );
            };


        }]);