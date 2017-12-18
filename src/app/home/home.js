angular.module("bawApp.home", [])

    .controller("HomeCtrl", ["$scope", "$resource", "$routeParams", "Project",

        function HomeCtrl($scope, $resource, $routeParams, Project) {
/*            // testing some es6 features

            var numbers = (new Array(100)).map((x, i) => i);
            console.log(numbers);

            var evenNumbers = numbers.filter(x => !(x & 1) );
            console.log("even:", evenNumbers);

            var newObj = {
                numbers,
                toString() {
                    "use strict";
                    console.warn(this.numbers);
                    return numbers;
                },
                [ "sum_" + evenNumbers.reduce( (a, x) => a + x, 0)]: " test!"
            };
            console.info(newObj);

            var [a, b, c] = [1, 2, 3];
            var {numbers: ns} = newObj;
            console.log(a, b, c, ns);

            var s = new Set();
            evenNumbers.forEach( x => s.add(x));
            numbers.forEach( x => s.add(x));
            console.log(s.size);

            var w = new WeakSet();
            w.add(newObj);
            console.warn(w);*/


//// TODO: disabled - authentication required for home page - BAD!
//// TODO: properly package this mess ... way too much in this controller
//    // to get projects to display
//    // make request only include lat/long and title/desc/id
//    $scope.projectsResource = $resource('/projects', {});
//    $scope.projects = $scope.projectsResource.query();
//
//    $scope.loadProjects = function(){
//        console.log('loadProjects');
//        $scope.populateProjectMarkers();
//    };
//
//    // for map
//    $scope.myMarkers = [];
//
//    $scope.mapOptions = {
//        center: new google.maps.LatLng(-20.911882621985757, 144.80555550000008),
//        zoom: 4,
//        mapTypeId: google.maps.MapTypeId.HYBRID
//    };
//
//    $scope.openMarkerInfo = function(marker) {
//        console.log('openMarkerInfo');
//        $scope.currentMarker = marker;
//        $scope.currentMarkerLat = marker.getPosition().lat();
//        $scope.currentMarkerLng = marker.getPosition().lng();
//        $scope.currentMarkerTitle = marker.getTitle();
//        $scope.currentMarkerId = marker.get('id');
//        $scope.myInfoWindow.open($scope.projectMap, marker);
//    };
//
//    $scope.addMarker = function($event) {
//        $scope.myMarkers.push(new google.maps.Marker({
//            map: $scope.projectMap,
//            position: $event.latLng
//        }));
//    };
//
//    $scope.setMarkerPosition = function(marker, lat, lng) {
//        marker.setPosition(new google.maps.LatLng(lat, lng));
//    };
//
//    $scope.populateProjectMarkers = function(){
//        var theProjects = $scope.projects;
//        var projectCount = theProjects.length;
//        angular.forEach(theProjects, function(value, key){
//            $scope.myMarkers.push(new google.maps.Marker({
//                map: $scope.projectMap,
//                position: new google.maps.LatLng (value.latitude, value.longitude),
//                title: value.name,
//                id: value.id
//            }));
//        });
//
//        $scope.zoomMapToFitMarkers();
//    };
//
//    $scope.zoomMapToFitMarkers = function(){
//        var bounds = new google.maps.LatLngBounds ();
//        var markerCount = $scope.myMarkers.length;
//        for (var index = 0; index < markerCount; index++) {
//            //  And increase the bounds to take this point
//            bounds.extend ($scope.myMarkers[index].getPosition());
//        }
//
//        //  Fit these bounds to the map
//        $scope.projectMap.fitBounds (bounds);
//    };
        }
    ]);
