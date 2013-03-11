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
            $http.get('/experiments/rapid_scan.json').
                success(function (data, status, headers, config) {
                    $scope.spec = data;
                    $scope.results.experiment = $scope.spec.experiment;

                    if ($routeParams.cheat) {
                        $scope.stage = $routeParams.cheat;
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

                $scope.step = 0;
                $scope.stage = $scope.EXPERIMENT_STAGE;

            };

            $scope.getPath = function () {
                if ($scope.spec && $scope.spec.experimentSteps && $scope.spec.experimentSteps[$scope.step]) {

                    return $scope.spec.experimentSteps[$scope.step].template
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


        }]);
})();
