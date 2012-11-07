"use strict";
/*
    The listen controller. Show a spectrogram, listen to audio, annotate the spectrogram.
*/
function ListenCtrl($scope, $resource, $location) {

    var recordingResource = $resource('/audio_recordings/:recordingId', {recordingId: '@id'}, {
        get: { method:'GET', params:{recordingId: '@id'}, isArray: false }
    });
    $scope.recording = recordingResource.get({recordingId:1});


    var spectrogramResource = $resource('/audio_recordings/:recordingId', {recordingId: '@id'}, {
        get: { method:'GET', params:{recordingId: '@id'}, isArray: false }
    });
    $scope.spectrogram = recordingResource.get({recordingId:1});


    var audioEventResource = $resource('/audio_recordings/:recordingId', {recordingId: '@id'}, {
        get: { method:'GET', params:{recordingId: '@id'}, isArray: false }
    });
    $scope.recording = recordingResource.get({recordingId:1});


    $scope.refresh = function($event) {
        //$ngModel.$render();
    };

}

ListenCtrl.$inject = ['$scope', '$resource', '$location']