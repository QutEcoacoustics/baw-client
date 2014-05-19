angular.module('bawApp.audioEvents', [])

    .controller('AudioEventsCtrl', ['$scope', '$resource', 'AudioEvent',
        function AudioEventsCtrl($scope, $resource, Project) {
            $scope.audioEventsResource = $resource('/audioEvents', {});
            $scope.audioEvents = $scope.audioEventsResource.query();

            $scope.links = function (key) {
                return AudioEventsCtrl.linkList(this.audioEvent.id)[key];
            };

            $scope["delete"] = function (id) {
                alert("deleting audio event {0}!".format(id));
            };
        }])

    .controller('AudioEventCtrl',
        ['$scope', '$resource', '$routeParams', 'AudioEvent',
            function AudioEventCtrl($scope, $resource, $routeParams, AudioEvent) {

            }]);


