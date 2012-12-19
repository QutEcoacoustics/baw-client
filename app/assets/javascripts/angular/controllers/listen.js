"use strict";
/**
 * The listen controller. Show a spectrogram, listen to audio, annotate the spectrogram.
 * @param $scope
 * @param $resource
 * @param $routeParams
 * @param AudioEvent
 * @constructor
 * @param Tag
 * @param Media
 */
function ListenCtrl($scope, $resource, $routeParams, Media, AudioEvent, Tag) {


    $scope.errorState = !GUID_REGEXP.test($routeParams.recordingId);

    if ($scope.errorState) {
        console.warn("Invalid guid specified in route... page rendering disabled");
    }
    else {
        var recordingId = $scope.recordingId = $routeParams.recordingId;


//
//        $scope.recording = AudioRecording.get($routeParams);
//
//        // HACK:
//        $scope.recordingurl = "/media/" + recordingId + "_0_120_0_11025.mp3";
//
//
//        var spectrogramResource = $resource('/media/:recordingId', {recordingId: '@recordingId'}, {
//            get: { method: 'GET', params: {recordingId: '@recordingId'}, isArray: false }
//        });
//        $scope.spectrogram = spectrogramResource.get($routeParams);
//
//        // HACK:
//        $scope.spectrogram.url = "/media/" + recordingId + "_0_120_0_11025_512_g.png" + "?" + angularCopies.toKeyValue($scope.authTokenParams());

        $scope.model = {};

        var formatPaths = function () {
            if ($scope.model.media && $scope.model.media.hasOwnProperty('recordingId')) {
                $scope.model.media.imageUrl = $scope.model.media.spectrogramBaseUrl.format($scope.model.media) + "?" + $scope.authTokenQuery();
                $scope.model.media.audioUrl = $scope.model.media.audioBaseUrl.format($scope.model.media) + "?" + $scope.authTokenQuery();
            }
        };
        $scope.$on('event:auth-loginRequired', formatPaths);
        $scope.$on('event:auth-loginConfirmed', formatPaths);

        $scope.model.media = Media.get($routeParams, {},
            function mediaGetSuccess() {
                // reformat url's
                formatPaths();
            },
            function mediaGetFailure() {
                throw "boo booos";
            });


        // TODO: add time bounds
        $scope.model.audioEvents = AudioEvent.query({byAudioId: recordingId});

        $scope.tags = Tag.query();

        $scope.limits = {
          timeMin: 0.0,
          timeMax: 120.0,
            freqMin: 0.0,
            freqMax: 11025.0
        };


        $scope.clearSelected = function() {
            $scope.selectedAnnotation = {};
        };

        $scope.addAnnotation = function createAnnotation() {
            var a = angular.copy(this.selectedAnnotation);

            // prep tags
            a.audio_event_tags_attributes = a.audioEventTags.map(function (v) {return {tag_id:v};});
            delete a.audioEventTtags

            a.audio_recording_id = recordingId;

            AudioEvent.save({audioEventId:null}, a,
                function createAnnotationSuccess(response, getResponseHeaders) {
                    console.log("Annotation creation successful");

                    // now update tag-list
                    $scope.model.audioEvents.push(response);
                    $scope.selectedAnnotation = response;

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

ListenCtrl.$inject = ['$scope', '$resource', '$routeParams', 'Media', 'AudioEvent', 'Tag'];