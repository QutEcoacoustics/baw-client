angular.module("bawApp.recordings", [])

.controller("RecordingsCtrl", ["$scope", "$resource",
function RecordingsCtrl($scope, $resource) {
    $scope.recordingsResource = $resource("/audio_recordings", {}, { get: { method:"GET", params:{}, isArray: true }});
    $scope.recordings = $scope.recordingsResource.get();
}])

.controller("RecordingCtrl", ["$scope", "$resource",
function RecordingCtrl($scope, $resource) {

    var recordingResource = $resource("/audio_recordings/:recordingId", {recordingId: "@id"}, {
        get: { method:"GET", params:{recordingId: "@id"}, isArray: false }
    });

    $scope.recording = recordingResource.get({recordingId:1});
}]);