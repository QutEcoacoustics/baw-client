"use strict";
/**
 * The listen controller. Show a spectrogram, listen to audio, annotate the spectrogram.
 * @param $scope
 * @param $resource
 * @param $routeParams
 * @param AudioRecording
 * @param AudioEvent
 * @constructor
 */
function ListenCtrl($scope, $resource, $routeParams, AudioRecording, AudioEvent) {


    var recordingResource = AudioRecording;

    $scope.errorState = !GUID_REGEXP.test($routeParams.recordingId)

    if ($scope.errorState) {
        console.warn( "Invalid guid specified in route... page rendering disabled");
    }
    else{
        $scope.recording = recordingResource.get($routeParams);

        // HACK:
        $scope.recordingurl =  "/media/" + $routeParams.recordingId +"_0_120_0_11025.mp3";


        var spectrogramResource = $resource('/media/:recordingId', {recordingId: '@recordingId'}, {
            get: { method:'GET', params:{recordingId: '@recordingId'}, isArray: false }
        });
        $scope.spectrogram = spectrogramResource.get($routeParams);

        // HACK:
        $scope.spectrogram.url = "/media/" + $routeParams.recordingId +"_0_120_0_11025_512_g.png";

    //    var audioEventResource = $resource('/audio_events?by_audio_id=:recordingId', {recordingId: '@recordingId'}, {
    //        get:
    //    });
        $scope.audio_events = AudioEvent.query({by_audio_id:$routeParams.recordingId});



    }
}

ListenCtrl.$inject = ['$scope', '$resource', '$routeParams', 'AudioRecording', 'AudioEvent'];