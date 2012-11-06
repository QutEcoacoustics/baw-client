"use strict";
function RecordingsCtrl($scope, $resource) {
    $scope.recordingsResource = $resource('/audio_recordings', {}, { get: { method:'GET', params:{}, isArray: true }});
    $scope.recordings = $scope.recordingsResource.get();
}

RecordingsCtrl.$inject = ['$scope', '$resource'];