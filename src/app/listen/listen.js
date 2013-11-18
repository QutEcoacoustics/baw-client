angular.module('bawApp.listen', [])

    .controller('ListenCtrl', ['$scope',
        '$resource',
        '$routeParams',
        '$route',
        'conf.paths',
        'conf.constants',
        '$url',
        'AudioRecording',
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
         * @param $url
         * @param AudioRecording
         */
        function ListenCtrl($scope, $resource, $routeParams, $route, paths, constants, $url, AudioRecording, Media, AudioEvent, Tag) {
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

            $scope.errorState =
                !(baw.isNumber($routeParams.recordingId) &&
                    baw.parseInt($routeParams.recordingId) >= 0);

            if ($scope.errorState) {
                console.warn("Invalid (or no) audio recording id specified in route... page rendering disabled");
            }
            else {

                // the core resource used in this controller
                var recordingId = $scope.recordingId = baw.parseInt($routeParams.recordingId);

                // parse the start and end offsets
                $routeParams.start = parseFloat($routeParams.start) || 0.0;
                // warn: this converts 0 to chunk duration
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

                        $scope.model.media.availableImageFormats[imgKeys[0]].url =
                            paths.joinFragments(paths.api.root, $scope.model.media.availableImageFormats[imgKeys[0]].url);
                        $scope.model.media.spectrogram = $scope.model.media.availableImageFormats[imgKeys[0]];

                        //$scope.model.media.spectrogramBaseUrl.format($scope.model.media);  + "?" + authToken;

                        // No longer necessary, new-api is HATEOASish
                        //$scope.model.media.audioUrls = [];
                        //angular.forEach($scope.model.media.options.audioFormats, function (value, key) {
                        //    $scope.model.media.audioFormat = value.extension;
                        //    this.push({url: $scope.model.media.audioBaseUrl.format($scope.model.media) + "?" + authToken, mime: value.mimeType});
                        //}, $scope.model.media.audioUrls);

                        angular.forEach($scope.model.media.availableAudioFormats, function (value, key) {

                            // just update the url so it is an absolute uri
                            this[key].url = paths.joinFragments(paths.api.root, value.url);

                        }, $scope.model.media.availableAudioFormats);

                    }
                };

                /* // NOT NECESSARY - we aren't using auth keys atm    */
                 $scope.$on('event:auth-loginRequired', formatPaths);
                 $scope.$on('event:auth-loginConfirmed', formatPaths);

                var fixMediaApi = function fixMediaApi() {
                    if ($scope.model.media && $scope.model.audioRecording) {
                        $scope.model.media.id = $scope.model.audioRecording.id;
                        $scope.model.media.uuid = $scope.model.audioRecording.uuid;
                    }
                };

                $scope.model.media = Media.get(getMediaParameters("json"), {},
                    function mediaGetSuccess() {
                        // reformat urls
                        formatPaths();

                        fixMediaApi();

                        // additionally do a check on the sample rate
                        // the sample rate is used in the unit calculations.
                        // it must be exposed and must be consistent for all sub-resources.
                        var sampleRate = null;
                        var sampleRateChecker = function (value, key) {
                            if (sampleRate === null) {
                                sampleRate = value.sampleRate;
                            }
                            else {
                                if (value.sampleRate !== sampleRate) {
                                    throw "The sample rates are not consistent for the media.json request. At the current time all sub-resources returned must be equal!";
                                }
                            }
                        };

                        angular.forEach($scope.model.media.availableAudioFormats, sampleRateChecker);
                        angular.forEach($scope.model.media.availableImageFormats, sampleRateChecker);

                        if (angular.isNumber(sampleRate)) {
                            $scope.model.media.sampleRate = sampleRate;
                        }
                        else {
                            throw "The provided sample rate for the Media json must be a number!";
                        }

                    },
                    function mediaGetFailure() {
                        console.error("retrieval of media json failed");
                    });

                $scope.model.audioRecording = AudioRecording.get({recordingId: recordingId}, {},
                    function audioRecordingGetSuccess() {
                        // no-op
                        // if an audioRecording 'model' is ever created, this is where we would transform the returned data

                        fixMediaApi();
                    },
                    function audioRecordingGetFailure() {
                        console.error("retrieval of audioRecording json failed");
                    });

                // TODO: add time bounds
                $scope.model.audioEvents = [];
                var tempEvents = AudioEvent.query({recordingId: recordingId},
                    function audioEventsQuerySuccess() {
                        // TODO : map tag's

                        $scope.model.audioEvents =
                            tempEvents.map(baw.Annotation.create);
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
                    if (!$scope.model.media || !$scope.model.audioRecording) {
                        return undefined;
                    }

                    var base = moment($scope.model.audioRecording.recordedDate);
                    var offset = base.add({seconds: $scope.model.media.startOffset});
                    return offset;
                };

                var listenUrl = paths.site;
                $scope.createNavigationHref = function (linkType, stepBy) {

                    if (!angular.isNumber(stepBy)) {
                        stepBy = CHUNK_DURATION_SECONDS;
                    }

                    var baseLink = {recordingId: recordingId};

                    if (linkType === "previous") {
                        var lowerBound = ($routeParams.start - stepBy);
                        if (lowerBound === 0) {
                            baseLink.end = lowerBound + stepBy;
                        }
                        else if (lowerBound > 0) {
                            baseLink.start = lowerBound;
                            baseLink.end = lowerBound + stepBy;
                        }
                        else {
                            // noop
                        }

                        var uriPrev = $url.formatUri(
                            paths.site.ngRoutes.listen,
                            baseLink);
                        return uriPrev;

                    }
                    else if (linkType === "next") {
                        var uriNext = $url.formatUri(
                            paths.site.ngRoutes.listen,
                            {
                                recordingId: recordingId,
                                start: ($routeParams.start + stepBy),
                                end: ($routeParams.end + stepBy)
                            });
                        return uriNext;
                    }

                    throw "Invalid link type specified in createNavigationHref";
                }
                ;

                $scope.clearSelected = function () {
                    //$scope.model.selectedAudioEvents.length = 0;

                    angular.forEach($scope.model.audioEvents, function (value, key) {
                        value.selected = false;
                    });
                };

                $scope.selectedFilter = function (audioEvent) {
                    return audioEvent.selected;
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
                    //var a = $scope.model.selectedAudioEvents[0];
                    //TODO: BROKEN!
                    var a = $scope.model.audioEvents.filter(function (value) {
                        return value.selected === true;
                    })[0];

                    // prep tags
//                    a.audio_event_tags_attributes = a.audioEventTags.map(function (v) {
//                        return {tag_id: v};
//                    });
//                    delete a.audioEventTags;

                    if (a.audioRecordingId !== recordingId) {
                        throw "The audioRecordingId should have been set way earlier!";
                    }

                    AudioEvent.save({audioEventId: null, recordingId: a.audioRecordingId}, a.exportObj(),
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


        }])
;
