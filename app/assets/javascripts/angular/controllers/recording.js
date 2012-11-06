"use strict";
function RecordingCtrl($scope, $resource) {

    var recordingResource = $resource('/audio_recordings/:recordingId', {recordingId: '@id'}, {
        get: { method:'GET', params:{recordingId: '@id'}, isArray: false }
    });

    $scope.recording = recordingResource.get({recordingId:1});
}

RecordingCtrl.$inject = ['$scope', '$resource']