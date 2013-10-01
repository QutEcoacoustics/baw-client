angular.module('bawApp.listen', [])

    .controller('ListenCtrl', ['$scope',
        '$resource',
        '$routeParams',
        '$route',
        'conf.paths',
        'conf.constants',
        '$url',
        'Media',
        'AudioEvent',
        'Tag',
        /**
         * The listen controller.
         * @param $scope
         * @param $resource
         * @param $routeParams
         * @param AudioEvent
         * @constructor
         * @param Tag
         * @param Media
         * @param $route
         * @param paths
         * @param constants
         */
            function ListenCtrl($scope, $resource, $routeParams, $route, paths, constants, $url, Media, AudioEvent, Tag) {
            var CHUNK_DURATION_SECONDS = constants.listen.chunkDurationSeconds;

            function getMediaParameters(format) {
                return {
                    start_offset: $routeParams.start,
                    end_offset: $routeParams.end,
                    // this one is different, it is encoded into the path of the request by angular
                    recordingId: $routeParams.recordingId,
                    format: format
                };
            }

            $scope.errorState = !(baw.isNumber($routeParams.recordingId) && baw.parseInt($routeParams.recordingId) >= 0);

            if ($scope.errorState) {
                console.warn("Invalid (or no) audio recording id specified in route... page rendering disabled");
            }
            else {

                // parse the start and end offsets
                $routeParams.start = parseFloat($routeParams.start) || 0.0;
                $routeParams.end = parseFloat($routeParams.end) || CHUNK_DURATION_SECONDS;
                var chunkDuration = ($routeParams.end - $routeParams.start);
                if (chunkDuration < 0) {

                    $routeParams.start = 0.0;
                    console.warn("invalid start offsets specified, reverting to safe value: start=" + $routeParams.start);
                }
                if (chunkDuration > CHUNK_DURATION_SECONDS) {
                    $routeParams.end = $routeParams.start + CHUNK_DURATION_SECONDS;
                    console.warn("invalid end offsets specified, reverting to safe value: end=" + $routeParams.end);
                }

                // the core resource used in this controller
                var recordingId = $scope.recordingId = $routeParams.recordingId;

                // set up some dummy objects for use later
                $scope.model = {
                    audioElement: {}
                };

                var formatPaths = function () {
                    if ($scope.model.media && $scope.model.media.hasOwnProperty('id')) {
                        //var authToken = $scope.authTokenQuery();

                        var imgKeys = Object.keys($scope.model.media.availableImageFormats);
                        if (imgKeys.length > 1) {
                            throw "don't know how to handle more than one image format!";
                        }

                        $scope.model.media.imageUrl =
                            $scope.model.media.availableImageFormats[imgKeys[0]] =
                            paths.joinFragments(paths.api.root, $scope.model.media.availableImageFormats[imgKeys[0]].url);
                        //$scope.model.media.spectrogramBaseUrl.format($scope.model.media);  + "?" + authToken;

                        // No longer necessary, new-api is HATEOASish
                        //$scope.model.media.audioUrls = [];
                        //angular.forEach($scope.model.media.options.audioFormats, function (value, key) {
                        //    $scope.model.media.audioFormat = value.extension;
                        //    this.push({url: $scope.model.media.audioBaseUrl.format($scope.model.media) + "?" + authToken, mime: value.mimeType});
                        //}, $scope.model.media.audioUrls);

                        angular.forEach($scope.model.media.available_audio_formats, function(key, value) {
                            this[key] =  paths.joinFragments(paths.api.root, value);
                        }, $scope.model.media.available_audio_formats);

                    }
                };
                $scope.$on('event:auth-loginRequired', formatPaths);
                $scope.$on('event:auth-loginConfirmed', formatPaths);

                $scope.model.media = Media.get(getMediaParameters("json"), {},
                    function mediaGetSuccess() {
                        // reformat url's
                        formatPaths();
                    },
                    function mediaGetFailure() {
                        console.error("retieval of media json failed");
                    });


                // TODO: add time bounds
                $scope.model.audioEvents = AudioEvent.query({recordingId: recordingId},
                    function audioEventsQuerySuccess() {
                        // TODO : map tag's

                        for (var index = 0; index < $scope.model.audioEvents.length; index++) {
                            // transform
                            $scope.model.audioEvents[index] = new baw.Annotation($scope.model.audioEvents[index]);
                        }
                    },
                    function audioEventQueryFailure() {
                        console.error("retrieval of audio events failed");
                    });

                // download all the tags and store them in Tag service cache
                // TODO: this is inefficient, make better in the future...
                $scope.tags = Tag.query({}, {}, function () {

                }, undefined);

                $scope.model.limits = {
                    timeMin: 0.0,
                    timeMax: 120.0,
                    freqMin: 0.0,
                    freqMax: 11025.0
                };


                $scope.startOffsetChunk = function () {
                    if (!$scope.model.media) {
                        return undefined;
                    }

                    return baw.secondsToDurationFormat($scope.model.media.startOffset);
                };
                $scope.endOffsetChunk = function () {
                    if (!$scope.model.media) {
                        return undefined;
                    }
                    return baw.secondsToDurationFormat($scope.model.media.endOffset);
                };

                $scope.durationChunk = function () {
                    if (!$scope.model.media) {
                        return undefined;
                    }
                    return baw.secondsToDurationFormat($scope.model.media.endOffset - $scope.model.media.startOffset);
                };

                $scope.currentOffsetChunk = function () {
                    var offset = 0;
                    if ($scope.model.audioElement) {
                        offset = $scope.model.audioElement.position;
                    }
                    return baw.secondsToDurationFormat(offset);
                };

                $scope.currentOffsetRecording = function () {
                    var offset = 0;
                    if ($scope.model.audioElement) {
                        offset = $scope.model.audioElement.position;
                    }

                    if (!$scope.model.media) {
                        return undefined;
                    }

                    var start = parseFloat($scope.model.media.startOffset);

                    return baw.secondsToDurationFormat(start + offset);
                };

                $scope.absoluteDateChunkStart = function () {
                    if (!$scope.model.media || !$scope.model.media.original) {
                        return undefined;
                    }

                    var base = moment($scope.model.media.original.recordedDate);
                    var offset = base.add({seconds: $scope.model.media.startOffset});
                    return offset;
                };

                var listenUrl = paths.site;
                $scope.createNavigationHref = function (linkType, stepBy) {

                    if (!angular.isNumber(stepBy)) {
                        stepBy = CHUNK_DURATION_SECONDS;
                    }

                    if (linkType === "previous") {
                        var uri = $url.formatUri(
                            paths.site.ngRoutes.listenAbsolute,
                            {start: ($routeParams.start - stepBy) , end: ($routeParams.end - stepBy)});
                        return uri;
                    }
                    else if (linkType === "next") {
                        var uri = $url.formatUri(
                            paths.site.ngRoutes.listenAbsolute,
                            {start: ($routeParams.start + stepBy) , end: ($routeParams.end + stepBy)});
                        return uri;
                    }

                    throw "Invalid link type specified in createNavigationHref";
                };

                $scope.clearSelected = function () {
                    //$scope.model.selectedAudioEvents.length = 0;

                    angular.forEach($scope.model.audioEvents, function (value, key) {
                        value._selected = false;
                    });
                };

                $scope.selectedFilter = function (audioEvent) {
                    return audioEvent._selected;
                };

                $scope.select2Settings = {
                    allowClear: true,
                    tags: $scope.tags
//                    id: function selectTagId(tag) {
//                        return tag.tagId;
//                    },
//                    initSelection: function (element, callback) {
//                        var data = [];
//                        $(element.val().split(",")).each(function () {
//                            data.push({id: this, text: this});
//                        });
//                        callback(data);
//                    }
                };

                $scope.select2Transformers = {

                    fromElement: function (tagResources) {
                        if (tagResources.length > 0) {

                            var result = tagResources.map(function (value) {
                                return new baw.AudioEventTag({tagId: value.id});
                            });

                            return result;
                        }

                        return tagResources;
                    },
                    // warning: IE8 incompatibility for array.prototype.map
                    fromModel: function (audioEventTags) {
                        if (audioEventTags.length > 0) {
                            var result = audioEventTags.map(function (value) {
                                return Tag.resolve(value.tagId);
                            });

                            //result = result.join(",");

                            return result;
                        }

                        return audioEventTags;
                    }
                };

                $scope.addAnnotation = function createAnnotation() {
                    // BUG: ONLY SAVES FIRST ONE
                    var a = angular.copy(this.$scope.model.selectedAudioEvents[0]);

                    // prep tags
                    a.audio_event_tags_attributes = a.audioEventTags.map(function (v) {
                        return {tag_id: v};
                    });
                    delete a.audioEventTtags;

                    a.audio_recording_id = recordingId;

                    AudioEvent.save({audioEventId: null}, a,
                        function createAnnotationSuccess(response, getResponseHeaders) {
                            console.log("Annotation creation successful");

                            // now update tag-list
                            $scope.model.audioEvents.push(response);

                        },
                        function createAnnotationFailure(response, getResponseHeaders) {
                            console.error("Annotation creation unsuccessful, response: " + response.status, response.data);
                        }
                    );
                };


            }


        }]);
