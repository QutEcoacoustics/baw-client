"use strict";

function AudioEventsCtrl($scope, $resource, Project) {
    $scope.audioEventsResource = $resource('/audioEvents', {});
    $scope.audioEvents = $scope.audioEventsResource.query();

    $scope.links = function(key) {
        return AudioEventsCtrl.linkList(this.audioEvent.id)[key];
    };

    $scope.delete = function(id) {
        alert("deleting audio event {0}!".format(id));
    };
}

AudioEventsCtrl.linkList = function (id) {
    return {
        edit: '/audioEvents/' + id + '/edit',
        details: '/audioEvents/' + id
    };
};

AudioEventsCtrl.$inject = ['$scope', '$resource', 'AudioEvent'];

function AudioEventCtrl($scope, $resource, $routeParams, AudioEvent) {

}

AudioEventCtrl.$inject = ['$scope', '$resource', '$routeParams', 'AudioEvent'];