"use strict";

;
(function (undefined) {
    var app = angular.module('bawApp.controllers');

    app.controller('ExperimentsCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'Media', 'AudioEvent', 'Tag',

        /**
         * The Experiments controller.
         * @param $scope
         * @param $resource
         * @param $routeParams
         * @param AudioEvent
         * @constructor
         * @param Tag
         * @param Media
         * @param $route
         * @param $http
         */
            function ExperimentsCtrl($scope, $resource, $routeParams, $route, $http, Media, AudioEvent, Tag) {

            $scope.PREFACE_STAGE = "preface";
            $scope.EXPERIMENT_STAGE = "experiment";
            $scope.FINAL_STAGE = "conclusion";

            $scope.results = {
                allowContact: true,
                consented: false,
                ethicsStatementViewed: false
            };
            $scope.errors = [];
            $scope.spec = {
                experimentSteps: []
            };
            $scope.stage = $scope.PREFACE_STAGE;
            $scope.step = 0;
            $scope.resultsSending = false;
            $scope.resultsSentSuccessfully = undefined;

            // todo: populate user information

            // download experiment protocol
            var experiment = $routeParams.experiment == "tour" ? '/experiment_assets/bird_tour.json' : '/experiment_assets/rapid_scan.json';
            $http.get(experiment).
                success(function (data, status, headers, config) {
                    $scope.spec = data;
                    $scope.results.experiment = $scope.spec.experiment;

                    if ($routeParams.cheat) {
                        $scope.stage = $routeParams.cheat;
                        if ($scope.stage = $scope.EXPERIMENT_STAGE) {
                            $scope.step = 1;
                        }
                    }
                }).error(function (data, status, headers, config) {
                    alert("downloading test specification failed");
                });

            $scope.login = function () {
                $scope.$emit('event:auth-loginRequired');
            };

            $scope.isChrome = function () {
                return Boolean(window.chrome);
            };

            $scope.verifyPreface = function verifyPreface() {
                $scope.errors.length = 0;

                if ($scope.results.consented !== true) {
                    $scope.errors.push("You must consent to participate in this experiment.");
                }

                if ($scope.results.ethicsStatementViewed !== true) {
                    $scope.errors.push("You must view the ethics statement before continuing (click on the link please).")
                }

                if ($scope.loggedIn && $scope.userData) {
                    $scope.results.userData = angular.copy($scope.userData);
                }
                else {
                    $scope.errors.push("You must be logged in to participate in this experiment, please log in.")
                }

                if (!$scope.isChrome()) {
                    $scope.errors.push("You must be using the Google Chrome web browser to continue")
                }

                if ($scope.errors.length > 0) {
                    return;
                }

                $scope.step = 1;
                $scope.stage = $scope.EXPERIMENT_STAGE;

            };

            $scope.getPath = function () {
                if ($scope.spec && $scope.spec.experimentSteps && $scope.spec.experimentSteps[$scope.step - 1]) {

                    return $scope.spec.experimentSteps[$scope.step - 1].template
                }
            };

            $scope.$watch(function () {
                return $scope.step;
            }, function (newValue, oldValue) {
                if (newValue > $scope.spec.experimentSteps.length) {
                    $scope.finishExperiment();
                }
            });


            $scope.finishExperiment = function () {

                $scope.step = 0;
                $scope.stage = $scope.FINAL_STAGE;

                // send back results to server
                $scope.resultsSending = true;
                $scope.resultsSentSuccessfully = undefined;
                $http.post('/experiments', $scope.results)
                    .success(function (data, status, headers, config) {

                        $scope.resultsSending = false;
                        $scope.resultsSentSuccessfully = true;
                    })
                    .error(function (data, status, headers, config) {
                        $scope.resultsSending = false;
                        $scope.resultsSentSuccessfully = false;
                    });
            };

            $scope.prettyResults = function() {
              return JSON.stringify($scope.results, undefined, 2);
            };


        }]);


    app.controller('RapidScanCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'Media', 'AudioEvent', 'Tag',
        function RapidScanCtrl($scope, $resource, $routeParams, $route, $http, Media, AudioEvent, Tag) {

            $scope.bigScope = $scope.$parent;

            $scope.bigScope.results.steps = angular.copy($scope.bigScope.spec.experimentSteps);

            $scope.stepResults = undefined;
            $scope.$watch(function () {
                return $scope.bigScope.step;
            }, function (newValue, oldValue) {
                $scope.stepResults = $scope.bigScope.results.steps[$scope.bigScope.step - 1];

                $scope.flashes = calculateFlashes();
            });

            $scope.startTimer = function() {
                $scope.stepResults.startTime  = Date.now();
            };

            $scope.startTimer = function() {
                $scope.stepResults.endTime  = Date.now();
            };

            $scope.SPECTROGRAM_WIDTH = 1080;
            var PPS = 45;
            $scope.flashes = [];

            function calculateFlashes() {
                var duration = $scope.stepResults.endTime - $scope.stepResults.startTime ;

                // work out the number of flash cards that need to be shown
                var adjustedPPS = PPS * $scope.stepResults.compression;
                var segmentDuration = $scope.SPECTROGRAM_WIDTH / adjustedPPS;

                var numberOfSegments = duration / segmentDuration;

                var segments = [];
                for(var i = 0; i < numberOfSegments; i++) {
                    var start = $scope.stepResults.endTime + (i * segmentDuration),
                        end = start + segmentDuration;

                    var imageUrl = "";

                    segments.push({start: start, end: end, imageLink: imageUrl});
                }

                return segments;
            }
        }]);

    app.controller('VirtualBirdTourCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'Media', 'AudioEvent', 'Tag',
        function VirtualBirdTourCtrl($scope, $resource, $routeParams, $route, $http, Media, AudioEvent, Tag) {

            $scope.bigScope = $scope.$parent;

            $scope.bigScope.results.steps = angular.copy($scope.bigScope.spec.experimentSteps);

            $scope.stepResults = undefined;
            $scope.$watch(function () {
                return $scope.bigScope.step;
            }, function (newValue, oldValue) {
                $scope.stepResults = $scope.bigScope.results.steps[$scope.bigScope.step - 1];
            });

            $scope.selectedTab = "instructions";

            $scope.locations = angular.copy($scope.bigScope.spec.locations);

            $scope.getLocation = function(name){
                var found = $scope.locations.filter(function(element, index, array){ return (element.name == name); });
                if(found.length == 1){
                    return found[0];
                }
                return null;
            };

            $scope.getMapForLocation = function(locationName, zoom){
                var locationInfo = $scope.getLocation(name);
                if(locationInfo){
                    var locationEncoded = baw.angularCopies.encodeUriQuery(locationInfo.name, true);
                    return "https://maps.googleapis.com/maps/api/staticmap?sensor=false&size=300x300&maptype=terrain&visible="+locationEncoded;
                }
            };

        }]);
})();
