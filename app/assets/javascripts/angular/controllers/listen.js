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
    var CHUNK_DURATION_SECONDS = 30.0;
    function getMediaParameters() {
        return {
            start_offset: $routeParams.start,
            end_offset: $routeParams.end,
            // this one is different, it is encoded into the path of the request by angular
            recordingId: $routeParams.recordingId

        }
    }

    $scope.errorState = !GUID_REGEXP.test($routeParams.recordingId);

    if ($scope.errorState) {
        console.warn("Invalid guid specified in route... page rendering disabled");
    }
    else {

        $routeParams.start =  parseFloat($routeParams.start) || 0.0;
        $routeParams.end =  parseFloat($routeParams.end) || CHUNK_DURATION_SECONDS;
        var chunkDuration = ($routeParams.end - $routeParams.start);
        if (chunkDuration < 0) {

            $routeParams.start = 0.0;
            console.warn("invalid start offsets specified, reverting to safe value: start=" + $routeParams.start );
        }
        if (chunkDuration > CHUNK_DURATION_SECONDS) {
            $routeParams.end = $routeParams.start + CHUNK_DURATION_SECONDS;
            console.warn("invalid end offsets specified, reverting to safe value: end=" + $routeParams.end );
        }



        var recordingId = $scope.recordingId = $routeParams.recordingId;

        $scope.model = {
            audioElement: {}
        };

        var formatPaths = function () {
            if ($scope.model.media && $scope.model.media.hasOwnProperty('recordingId')) {
                var authToken = $scope.authTokenQuery();
                $scope.model.media.imageUrl = $scope.model.media.spectrogramBaseUrl.format($scope.model.media) + "?" + authToken;

                $scope.model.media.audioUrls = [];
                angular.forEach($scope.model.media.options.audioFormats, function (value, key){
                    $scope.model.media.audioFormat = value.extension;
                    this.push({url: $scope.model.media.audioBaseUrl.format($scope.model.media) + "?" + authToken, mime: value.mimeType});
                },$scope.model.media.audioUrls);

            }
        };
        $scope.$on('event:auth-loginRequired', formatPaths);
        $scope.$on('event:auth-loginConfirmed', formatPaths);

        $scope.model.media = Media.get(getMediaParameters(), {},
            function mediaGetSuccess() {
                // reformat url's
                formatPaths();
            },
            function mediaGetFailure() {
                throw "boo booos";
            });


        // TODO: add time bounds
        $scope.model.audioEvents = AudioEvent.query({byAudioId: recordingId},
            function audioEventsQuerySuccess() {
                // TODO : map tag's


                for (var index = 0; index < $scope.model.audioEvents.length; index++) {
                    // give local Ids
                    $scope.model.audioEvents[index].__temporaryId__ = Number.Unique;

                    // give other properties
                    $scope.model.audioEvents[index]._selected = false;
                }
            },
            function audioEventQueryFailure() {

            });


        $scope.tags = Tag.query();

        $scope.model.limits = {
          timeMin: 0.0,
          timeMax: 120.0,
            freqMin: 0.0,
            freqMax: 11025.0
        };


        $scope.clearSelected = function() {
            //$scope.model.selectedAudioEvents.length = 0;

            angular.forEach($scope.model.audioEvents, function (value, key){
               value._selected = false;
            });
        };

        $scope.selectedFilter = function(audioEvent) {
            return audioEvent._selected;
        };

        $scope.debug = function(args) {
            console.log(args);
            console.log(this);

        };

//        $scope.selectAudioEvent = function(audioEvent) {
//            $scope.model.selectedAudioEvents.length = 0;
//            $scope.model.selectedAudioEvents.push(audioEvent);
//        };


        $scope.addAnnotation = function createAnnotation() {
            // BUG: ONLY SAVES FIRST ONE
            var a = angular.copy(this. $scope.model.selectedAudioEvents[0]);

            // prep tags
            a.audio_event_tags_attributes = a.audioEventTags.map(function (v) {return {tag_id:v};});
            delete a.audioEventTtags;

            a.audio_recording_id = recordingId;

            AudioEvent.save({audioEventId:null}, a,
                function createAnnotationSuccess(response, getResponseHeaders) {
                    console.log("Annotation creation successful");

                    // now update tag-list
                    $scope.model.audioEvents.push(response);

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
