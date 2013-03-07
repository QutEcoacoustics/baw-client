"use strict";

;
(function (undefined) {
    var app = angular.module('bawApp.controllers');

    app.controller('ExperimentsCtrl', ['$scope', '$resource', '$routeParams', '$route', '$http', 'Media', 'AudioEvent', 'Tag',

        /**
         * The listen controller.
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
        function ExperimentsCtrl($scope, $resource, $routeParams, $route,  $http, Media, AudioEvent, Tag) {

            $scope.results = {};

            // todo: populate user information

            // download experiment protocol
            $http.get('/experiments/rapid_scan.json').
                 success(function(data, status, headers, config) {
                    $scope.spec = data;
                }).error(function( data, status, headers, config) {
                    alert("downloading test specification failed");
                });


            function downloadResults() {

            }

        }]);
})();
