angular.module('bawApp.listen', ['decipher.tags', 'ui.bootstrap.typeahead'])

    .controller('ListenCtrl', ['$scope',
        '$resource',
        '$location',
        '$routeParams',
        '$route',
        '$q',
        'conf.paths',
        'conf.constants',
        '$url',
        'AudioRecording',
        'Media',
        'AudioEvent',
        'Tag',
        'Taggings',
        'Site',
        'Project',
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
         * @param Taggings
         * @param $q
         * @param Site
         * @param Project
         */
            function ListenCtrl(
            $scope, $resource, $location, $routeParams, $route, $q, paths, constants, $url,
            AudioRecording, Media, AudioEvent, Tag, Taggings, Site, Project) {

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

            $scope.errorState = !(baw.isNumber($routeParams.recordingId) &&
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
                $scope.jumpToHide = true;
                $scope.model = {
                    audioElement: {},
                    audioEvents: [],
                    media: null,
                    selectedAudioEvent: null,
                    audioRecording: null,
                    project: null,
                    site: null
                };

                var formatPaths = function () {
                    if ($scope.model.media && $scope.model.media.hasOwnProperty('id')) {
                        //var authToken = $scope.authTokenQuery();

                        var imgKeys = Object.keys($scope.model.media.availableImageFormats);
                        if (imgKeys.length > 1) {
                            throw "don't know how to handle more than one image format!";
                        }

                        $scope.model.media.availableImageFormats[imgKeys[0]].url =
                            paths.joinFragments(paths.api.root,
                                $scope.model.media.availableImageFormats[imgKeys[0]].url);
                        $scope.model.media.spectrogram = $scope.model.media.availableImageFormats[imgKeys[0]];

                        angular.forEach($scope.model.media.availableAudioFormats, function (value, key) {

                            // just update the url so it is an absolute uri
                            this[key].url = paths.joinFragments(paths.api.root, value.url);

                        }, $scope.model.media.availableAudioFormats);

                    }
                };

                /* // NOT NECESSARY - we aren't using auth keys atm    */
                $scope.$on('event:auth-loginRequired', formatPaths);
                $scope.$on('event:auth-loginConfirmed', formatPaths);

                $scope.model.media = Media.get(getMediaParameters("json"), {},
                    function mediaGetSuccess() {
                        // reformat urls
                        formatPaths();

                        //                        fixMediaApi();

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


                var promise = (function getResources() {
                    var deferred = $q.defer();

                    AudioRecording.get({recordingId: recordingId}, {},
                        function audioRecordingGetSuccess(value) {
                            // if an audioRecording 'model' is ever created, this is where we would transform the returned data
                            $scope.model.audioRecording = value;

                            // set up jumpto vars
                            var maxMinutes = Math.floor(parseFloat($scope.model.audioRecording.durationSeconds) / 60);
                            $scope.jumpToMax = maxMinutes;
                            $scope.jumpToMinute = Math.floor( parseFloat($routeParams.start) / 60);
                            $scope.jumpToHide = false;
                            deferred.resolve(value);
                        },
                        function audioRecordingGetFailure() {
                            deferred.reject("retrieval of audioRecording json failed");
                        });

                    return deferred.promise;
                })()
                    .then(function success(result) {
                        var siteDeferred = $q.defer();
                        // get site
                        Site.get({siteId: result.siteId}, {}, function getSiteSuccess(value) {
                            $scope.model.site = value;
                            siteDeferred.resolve(value)
                        }, function getSiteError() {
                            siteDeferred.reject("retrieval of site json failed");
                        });

                        return siteDeferred.promise;
                    })
                    .then(function success() {
                        var projectDeferred = $q.defer();
                        // get site
                        Project.get({id: result.projectId}, {}, function getProjectSuccess(value) {
                            $scope.model.project = value;
                            projectDeferred.resolve(value)
                        }, function getSiteError() {
                            projectDeferred.reject("retrieval of site json failed");
                        });

                        return projectDeferred.promise;
                    }).catch(function error(err) {
                        console.error("An error occurred downloading metadata for this chunk:" + err, err);
                    });


                AudioEvent.query(
                    {
                        recordingId: recordingId,
                        start_offset: $routeParams.start,
                        end_offset: $routeParams.end
                    },
                    function audioEventsQuerySuccess(value, responseHeaders) {
                        $scope.model.audioEvents = value.map(baw.Annotation.make);

                        $scope.model.audioEvents.forEach(function (value) {
                            Tag.resolveAll(value.tags, $scope.tags);
                        });
                    },
                    function audioEventQueryFailure() {
                        console.error("retrieval of audio events failed");
                    });

                // download all the tags and store them in Tag service cache
                // TODO: this is inefficient, make better in the future...
                $scope.tags = [];
                Tag.query({}, {},
                    function success(value) {
                        value.forEach(function (value) {
                            $scope.tags.push(baw.Tag.make(value));
                        });

                        $scope.model.audioEvents.forEach(function (value) {
                            Tag.resolveAll(value.tags, $scope.tags);
                        });
                    },
                    function failure() {
                        console.error("Tag retrieval failure", arguments);
                    });


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


                $scope.previousEnabled = false;
                $scope.nextEnabled = false;
                $scope.createNavigationHref = function (linkType, stepBy) {
                    // skip if resources not available
                    if (!$scope.model.audioRecording) {
                        return "#";
                    }

                    if (!angular.isNumber(stepBy)) {
                        stepBy = CHUNK_DURATION_SECONDS;
                    }

                    var baseLink = {recordingId: recordingId};

                    if (linkType === "previous") {
                        var lowerBound = ($routeParams.start - stepBy);

                        if ($routeParams.start > 0) {
                            $scope.previousEnabled = true;
                        } else {
                            $scope.previousEnabled = false;
                        }

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

                        var maxEnd = Math.floor($scope.model.audioRecording.durationSeconds);

                        var uriNext = $url.formatUri(
                            paths.site.ngRoutes.listen,
                            {
                                recordingId: recordingId,
                                start: ($routeParams.start + stepBy),
                                end: (($routeParams.end + stepBy < maxEnd) ? $routeParams.end + stepBy : maxEnd)
                            });

                        if ($routeParams.end < $scope.model.audioRecording.durationSeconds - constants.listen.minAudioDurationSeconds) {
                            $scope.nextEnabled = true;
                        } else {
                            $scope.nextEnabled = false;
                        }

                        return uriNext;
                    }

                    throw "Invalid link type specified in createNavigationHref";
                };


                $scope.jumpTo = function() {
                    var maxEnd = Math.floor($scope.model.audioRecording.durationSeconds),
                        seconds = $scope.jumpToMinute * 60;
                    if (seconds < 0) {
                        seconds = 0;
                    }
                    if (seconds > (maxEnd - CHUNK_DURATION_SECONDS)) {
                        seconds = (maxEnd - CHUNK_DURATION_SECONDS);
                    }

                    var url = $url.formatUri(
                        paths.site.ngRoutes.listen,
                        {
                            recordingId: recordingId,
                            start: seconds,
                            end: seconds + CHUNK_DURATION_SECONDS
                        });

                    $location.url(url);
                };

                $scope.clearSelected = function () {
                    $scope.model.audioEvents.forEach(function (value, key) {
                        value.selected = false;
                    });

                    $scope.model.selectedAudioEvent = null;
                };


                $scope.singleEditDisabled = function () {
                    return ($scope.model.selectedAudioEvent === null || $scope.model.selectedAudioEvent.id === undefined);
                };


                $scope.typeaheadOpts = {
                    //inputFormatter: myInputFormatterFunction,
                    //loading: myLoadingBoolean,
                    minLength: 1
                    //onSelect: myOnSelectFunction, // this will be run in addition to directive internals
                    //templateUrl: "template/typeahead/typeahead-popup.htmlzzzzzzzzz"
                    //waitMs: 500,
                    //allowsEditable: true
                };

                $scope.taggerOptions = {
                    delimiter: ",",
                    addable: true,
                    //classes:
                    templateUrl: "/templates/tags.html",
                    tagTemplateUrl: "/templates/tags.html"
                };

                $scope.$on('decipher.tags.initialized', function (event) {
                    event.stopPropagation();
                    console.debug('decipher.tags.initialized', arguments);
                });
                $scope.$on('decipher.tags.keyup', function (event) {
                    event.stopPropagation();
                    console.debug('decipher.tags.keyup', arguments);
                });
                $scope.$on('decipher.tags.added', function (event, addedTag) {
                    event.stopPropagation();
                    console.debug('decipher.tags.added', arguments);

                    var taggingParameters = {
                        recordingId: recordingId,
                        audioEventId: $scope.model.selectedAudioEvent.id
                    };

                    var index = $scope.model.selectedAudioEvent.tags.length; //.indexOf(addedTag.tag);


                    Taggings.save(taggingParameters, {tagId: addedTag.tag.id},
                        function success(value, headers) {

                            // possible race condition: may no longer may be selected after async
                            $scope.model.selectedAudioEvent.taggings[index] = new baw.Tagging(value);

                            console.assert(
                                $scope.model.selectedAudioEvent.tags.length ==
                                    $scope.model.selectedAudioEvent.taggings.length,
                                "The taggings array and tags array are out of sync, this is bad");

                            console.debug("Tag addition success", addedTag.tag.text);
                        },
                        function error(response) {
                            console.error("Tagging creation failed", response);
                        });
                });
                $scope.$on('decipher.tags.addfailed', function (event) {
                    event.stopPropagation();
                    console.debug('decipher.tags.addfailed', arguments);
                });
                $scope.$on('decipher.tags.removed', function (event, removedTag) {
                    event.stopPropagation();
                    console.debug('decipher.tags.removed', arguments);

                    var index = _.findIndex($scope.model.selectedAudioEvent.taggings, function (value) {
                        return value.tagId = removedTag.tag.id;
                    });
                    var oldTagging = $scope.model.selectedAudioEvent.taggings[index];

                    var taggingParameters = {
                        recordingId: recordingId,
                        audioEventId: $scope.model.selectedAudioEvent.id,
                        taggingId: oldTagging.id
                    };

                    console.assert(
                        $scope.model.selectedAudioEvent.tags.length ==
                            $scope.model.selectedAudioEvent.taggings.length,
                        "The taggings array and tags array are out of sync, this is bad");

                    Taggings.remove(taggingParameters, {},
                        function success(value, headers) {
                            // possible race condition: may no longer may be selected after async
                            $scope.model.selectedAudioEvent.taggings.splice(index, 1);

                            // assumes tags array is kept in sync
                            //delete $scope.model.selectedAudioEvent.tags[index];

                            console.debug("Tag removal success", removedTag.tag.text);
                        },
                        function error(response) {
                            console.error("Tagging creation failed", response);
                        }
                    )
                    ;
                });
            }


        }])
;
