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
function ListenCtrl($scope, $resource, $routeParams, AudioRecording, AudioEvent, Tag) {


    $scope.errorState = !GUID_REGEXP.test($routeParams.recordingId);

    if ($scope.errorState) {
        console.warn("Invalid guid specified in route... page rendering disabled");
    }
    else {
        var recordingId = $scope.recordingId = $routeParams.recordingId;

        $scope.recording = AudioRecording.get($routeParams);

        // HACK:
        $scope.recordingurl = "/media/" + recordingId + "_0_120_0_11025.mp3";


        var spectrogramResource = $resource('/media/:recordingId', {recordingId: '@recordingId'}, {
            get: { method: 'GET', params: {recordingId: '@recordingId'}, isArray: false }
        });
        $scope.spectrogram = spectrogramResource.get($routeParams);

        // HACK:
        $scope.spectrogram.url = "/media/" + recordingId + "_0_120_0_11025_512_g.png" + "?" + angularCopies.toKeyValue($scope.authTokenParams());
        $scope.$on('event:auth-loginRequired', function () {
            $scope.spectrogram.url = "/media/" + recordingId + "_0_120_0_11025_512_g.png" + "?" + angularCopies.toKeyValue($scope.authTokenParams());
        });
        $scope.$on('event:auth-loginConfirmed', function () {
            $scope.spectrogram.url = "/media/" + recordingId + "_0_120_0_11025_512_g.png" + "?" + angularCopies.toKeyValue($scope.authTokenParams());
        });


        //    var audioEventResource = $resource('/audio_events?by_audio_id=:recordingId', {recordingId: '@recordingId'}, {
        //        get:
        //    });
        $scope.audio_events = AudioEvent.query({by_audio_id: recordingId});


        // HACK:
        // this should be treated as readonly
//        $scope.tags = [
//            {text: "HALLO!", type_of_tag: null, is_taxanomic: false, id: -1},
//            {text: "Koala", type_of_tag: "common_name", is_taxanomic: true, id: -2},
//            {text: "Corrus Ovvu", type_of_tag: "species_name", is_taxanomic: true, id: -3},
//            {text: "Cawwing", type_of_tag: "sounds_like", is_taxanomic: false, id: -4}
//        ];
        $scope.tags = Tag.query();

        $scope.limits = {
          time_min: 0.0,
          time_max: 120.0,
            freq_min: 0.0,
            freq_max: 11025.0
        };

        $scope.selectedAnnotation = {
            audio_event_tags: [-1],
            start_time_seconds: 0.05,
            end_time_seconds: 15.23,
            low_frequency_hertz:1000,
            high_frequency_hertz: 8753
        };

        $scope.clearSelected = function() {
            $scope.selectedAnnotation = {};
        };

        $scope.addAnnotation = function createAnnotation() {
            var a = angular.copy(this.selectedAnnotation);

            // prep tags
            a.audio_event_tags_attributes = a.audio_event_tags.map(function (v) {return {tag_id:v};});
            delete a.audio_event_tags

            a.audio_recording_id = recordingId;

            AudioEvent.save({audioEventId:null}, a,
                function createAnnotationSuccess(response, getResponseHeaders) {
                    console.log("Annotation creation successful");

                    // now update tag-list
                    $scope.audio_events.push(response);
                    $scope.selected_Annotation = response;

                },
                function createAnnotationFailure(response, getResponseHeaders) {
                    console.error("Annotation creation unsuccessful, response: " + response.status, response.data);
                }
            )
        };


//        $scope.update = function updateProject() {
//            // do not send back the full object for update
//            var p = {};
//            p.name = this.project.name;
//            p.urn = this.project.urn;
//            p.description = this.project.description;
//            p.notes = this.project.notes;
//            p.site_ids = (this.project.sites || []).map(function(value) {return {id: value.id}});
//
//            projectResource.update(routeArgs, p,  (function() {console.log("success update")}));
//        };
    }
}

ListenCtrl.$inject = ['$scope', '$resource', '$routeParams', 'AudioRecording', 'AudioEvent', 'Tag'];