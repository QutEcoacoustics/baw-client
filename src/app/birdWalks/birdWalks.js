angular.module("bawApp.birdWalks", [])
    .controller("BirdWalksCtrl", ["$scope", "$resource", "$routeParams", "$route", "$http", "BirdWalkService", "conf.paths",
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
            BirdWalkService.getUrl(paths.site.files.birdWalk.specAbsolute, "birdWalkSpec", $scope, null);
            BirdWalkService.getUrl(paths.site.files.birdWalk.statsAbsolute, "birdWalkStats", $scope, null);
        }])
    .controller("BirdWalkCtrl", ["$scope", "$resource", "$routeParams", "$route", "$http", "BirdWalkService", "conf.paths",
        function BirdWalkCtrl($scope, $resource, $routeParams, $route, $http, BirdWalkService, paths) {

            // constants
            //var CURRENT_LOCATION_ZOOM = 8;

            // initialise
            $scope.imagesPath = paths.site.files.birdWalk.imagesAbsolute;
            $scope.params = $routeParams;
            BirdWalkService.getUrl(paths.site.files.birdWalk.statsAbsolute, "birdWalkStats", $scope, null);
            BirdWalkService.getUrl(paths.site.files.birdWalk.specAbsolute, "birdWalkSpec", $scope, function () {
                // set up page display
                $scope.walkDetails = $scope.spec.birdWalkSpec.walks[$scope.params.birdWalkId];
                $scope.locationDetails = $scope.spec.birdWalkSpec.locations[$scope.walkDetails.locationName];

                throw new Error ("google not defined");/*
                var overviewLocation;= new google.maps.LatLng( // jshint ignore:line
                    $scope.walkDetails.overviewLocation.latitude,
                    $scope.walkDetails.overviewLocation.longitude);

                $scope.locationMap = $scope.createMap("locationMap", overviewLocation, CURRENT_LOCATION_ZOOM);

                var bounds = new google.maps.LatLngBounds();
                $scope.walkDetails.waypoints.forEach(function(waypoint){

                    var markerLocation = new google.maps.LatLng(
                        waypoint.latitude,
                        waypoint.longitude);

                    bounds.extend(markerLocation);
                    $scope.createMarker($scope.locationMap, markerLocation, waypoint.name);
                });

                if($scope.walkDetails.waypoints.length < 1){
                    bounds.extend(overviewLocation);
                }

                $scope.locationMap.fitBounds(bounds);*/
            });


            //$scope.spec.birdWalkSpec.walks
/*
            $scope.createMap = function (elementId, LatLng, zoom) {
                throw new Error("google is not defined");
                
                return new google.maps.Map(
                    document.getElementById(elementId),
                    {
                        center: LatLng,
                        zoom: zoom,
                        mapTypeId: google.maps.MapTypeId.HYBRID
                    }
                );
            };
*/
            $scope.createMarker = function (map, LatLng, title) {
                throw new Error("MarkerWithLabel is not defined");
                /*var marker = new MarkerWithLabel({
                    position: LatLng,
                    draggable: true,
                    raiseOnDrag: true,
                    map: map,
                    labelContent: title,
                    labelAnchor: new google.maps.Point(0, 0),
                    labelClass: "markerLabel" // the CSS class for the label
                });

                return marker;
//                new google.maps.Marker({
//                    position: LatLng,
//                    map: map,
//                    title: title
//                });
*/
            };


        }]);