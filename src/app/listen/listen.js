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
        'ngAudioEvents',
        'AudioRecording',
        'Media',
        "baw.models.Media",
        'AudioEvent',
        'Tag',
        'Taggings',
        'Site',
        'Project',
        'UserProfile',
        'UserProfileEvents',
        'Bookmark',
        /**
         * The listen controller.
         * @param $scope
         * @param $resource
         * @param $routeParams
         * @param Media
         * @param AudioEvent
         * @constructor
         * @param Tag
         * @param MediaService
         * @param $route
         * @param paths
         * @param constants
         * @param $url
         * @param AudioRecording
         * @param Taggings
         * @param $q
         * @param Site
         * @param Project
         * @param $location
         * @param ngAudioEvents
         * @param UserProfile
         * @param Bookmark
         * @param UserProfileEvents
         */
            function ListenCtrl(
            $scope, $resource, $location, $routeParams, $route, $q, paths, constants, $url, ngAudioEvents,
            AudioRecording, MediaService, Media, AudioEvent, Tag, Taggings, Site, Project, UserProfile, UserProfileEvents, Bookmark) {


            var CHUNK_DURATION_SECONDS = constants.listen.chunkDurationSeconds;

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
                $scope.startOffsetAbsolute = null;
                $scope.endOffsetAbsolute = null;
                $scope.model = {
                    audioElement: {
                        volume: null,
                        muted: null,
                        autoPlay: $routeParams.autoPlay || false
                    },
                    audioEvents: [],
                    media: null,
                    selectedAudioEvent: null,
                    audioRecording: null,
                    projects: [],
                    site: null
                };

                // bind user profile
                var profileLoaded = function updateProfileSettings(event, UserProfile) {
                    $scope.model.audioElement.volume = UserProfile.profile.preferences.volume;
                    $scope.model.audioElement.muted = UserProfile.profile.preferences.muted;

                    $scope.model.audioElement.autoPlay = UserProfile.profile.preferences.autoPlay || $routeParams.autoPlay;
                };
                $scope.$on(UserProfileEvents.loaded, profileLoaded);
                if (UserProfile.profile && UserProfile.profile.preferences) {
                    profileLoaded(null, UserProfile);
                }

                // auto play feature
                $scope.$on(ngAudioEvents.ended, function navigate(event) {

                    if ($scope.nextEnabled && $scope.model.audioElement.autoPlay) {
                        console.info("Changing page to next segment...");
                        $scope.$apply(function() {
                            $location.search({autoPlay: true, start: nextStart, end: nextEnd});
                        });
                    }
                    else {
                        console.warn("Continuous playback cannot continue");
                    }
                });
                $scope.$watch(function() {
                    return $scope.model.audioElement.autoPlay;
                }, function(newValue, oldValue) {
                    if (UserProfile.profile && (UserProfile.profile.preferences.autoPlay !== newValue)) {
                        $scope.$emit("autoPlay", newValue);
                    }
                });

                /* // NOT NECESSARY - we aren't using auth keys atm    */
                $scope.$on('event:auth-loginRequired', function(){ $scope.model.media.formatPaths(); });
                $scope.$on('event:auth-loginConfirmed', function(){ $scope.model.media.formatPaths(); });

                MediaService.get(
                    {
                        recordingId: $routeParams.recordingId,
                        start_offset: $routeParams.start,
                        end_offset: $routeParams.end,
                        format: "json"
                    },
                    function mediaGetSuccess(value, responseHeaders) {
                        $scope.model.media = new Media(value.data);

                        var // moment works by reference - need to parse the date twice - sigh
                            absoluteStartChunk = moment($scope.model.media.recordedDate).add('s', parseFloat($scope.model.media.startOffset)),
                            absoluteEndChunk = moment($scope.model.media.recordedDate).add('s', parseFloat($scope.model.media.endOffset));

                        $scope.startOffsetAbsolute = absoluteStartChunk.format("HH:mm:ss");
                        $scope.endOffsetAbsolute = absoluteEndChunk.format("HH:mm:ss");
                        $scope.downloadAnnotationsLink  = AudioEvent.csvLink(
                            {
                                recordingId: value.id,
                                startOffset: value.startOffset,
                                endOffset: value.endOffset
                            });

                    },
                    function mediaGetFailure() {
                        console.error("retrieval of media json failed");
                    });


                var getAudioRecording = function getAudioRecording(recordingId) {
                    var deferred = $q.defer();

                    AudioRecording.get({recordingId: recordingId}, {},
                        function audioRecordingGetSuccess(value) {
                            // if an audioRecording 'model' is ever created, this is where we would transform the returned data
                            $scope.model.audioRecording = value;

                            var result = {audioRecording: value};

                            // set up jumpto vars
                            var maxMinutes = Math.floor(parseFloat($scope.model.audioRecording.durationSeconds) / 60);
                            $scope.jumpToMax = maxMinutes;
                            $scope.jumpToMinute = Math.floor( parseFloat($routeParams.start) / 60);
                            $scope.jumpToHide = false;

                            deferred.resolve(result);
                        },
                        function audioRecordingGetFailure() {
                            deferred.reject("retrieval of audioRecording json failed");
                        });

                    return deferred.promise;
                };

                var getSite = function getSite(result) {
                    var siteDeferred = $q.defer();
                    // get site
                    Site.get({siteId: result.audioRecording.siteId}, {}, function getSiteSuccess(value) {

                        value.links = value.projectIds.map(function(id) {
                            return paths.api.routes.site.nestedAbsolute.format({"siteId": value.id, "projectId": id});
                        });

                        $scope.model.site = value;
                        result.site = value;
                        siteDeferred.resolve(result);
                    }, function getSiteError() {
                        siteDeferred.reject("retrieval of site json failed");
                    });

                    return siteDeferred.promise;
                };

                var getProjects = function getProjects(result) {
                    var projectPromises = [];

                    $scope.model.projects = $scope.model.projects || [];
                    result.projects = result.projects || [];

                    result.site.projectIds.forEach(function (id, index) {
                        var projectDeferred = $q.defer();
                        // get project
                        Project.get({projectId: id}, {}, function getProjectSuccess(value) {

                            value.link = paths.api.routes.projectAbsolute.format({"projectId": value.id});

                            $scope.model.projects[index] = value;
                            result.projects[index] = value;
                            projectDeferred.resolve(result);
                        }, function getProjectError(error) {
                            if (error.status === 403) {
                                console.warn("The project %s does not give permissions to current user to access it's content. There are %s projects.", id, result.site.projectIds.length);
                                // populate field anyway, not really sure what to do here, temp value added
                                var denied =  {
                                    id: id,
                                    permissions: "access denied"
                                };

                                denied.link = paths.api.routes.projectAbsolute.format({"projectId": denied.id});

                                $scope.model.projects[index] = denied;
                                result.projects[index] = denied;

                                // we don't mind that this "error" has occurred - there should be at least one project
                                // that did resolve. Resolve promise anyway
                                projectDeferred.resolve(result);
                            }
                            else {
                                projectDeferred.reject("retrieval of project json failed");
                            }
                        });

                        projectPromises[index] = projectDeferred.promise;
                    });

                    return $q.all(projectPromises);
                };
                getAudioRecording(recordingId).then(getSite).then(getProjects).then(function success(result) {
                    console.info("Metadata Promise chain success", result);
                }, function error(err) {
                    console.error("An error occurred downloading metadata for this chunk:" + err, err);
                }, function notify() {
                    // TODO: remove dodgy scope closure from promise functions, and update values here incrementally!
                    console.debug("All promises notify", arguments);
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




                $scope.durationChunk = function () {
                    if (!$scope.model.media) {
                        return undefined;
                    }
                    return baw.secondsToDurationFormat($scope.model.media.endOffset - $scope.model.media.startOffset);
                };

                $scope.endRecordingAbsolute = function () {
                    if (!$scope.model.audioRecording) {
                        return undefined;
                    }
                    return moment($scope.model.audioRecording.recordedDate).add('s', $scope.model.audioRecording.durationSeconds).format("YYYY-MMM-DD, HH:mm:ss");
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

                $scope.currentOffsetAbsolute = function () {
                    var chunkOffset = 0;
                    if ($scope.model.audioElement) {
                        chunkOffset = $scope.model.audioElement.position;
                    }

                    if (!$scope.model.media) {
                        return undefined;
                    }

                    var baseDate = moment($scope.model.media.recordedDate),
                        recordingOffset = parseFloat($scope.model.media.startOffset),
                        absolute = baseDate.add('s', recordingOffset + chunkOffset);

                    return absolute.format("HH:mm:ss.SSS");
                };

                $scope.absoluteDateChunkStart = function () {
                    if (!$scope.model.media || !$scope.model.audioRecording) {
                        return undefined;
                    }

                    var base = moment($scope.model.audioRecording.recordedDate);
                    var offset = base.add({seconds: $scope.model.media.startOffset});
                    return offset;
                };

                $scope.jumpToMinuteAbsolute = function jumpToMinuteCalculation() {
                    if (!$scope.model.media) {
                        return undefined;
                    }
                    
                    return moment($scope.model.media.recordedDate).add('m', $scope.jumpToMinute).format("YYYY-MMM-DD, HH:mm:ss");
                };


                $scope.previousEnabled = false;
                $scope.nextEnabled = false;
                // hacky hack for continuous playback
                var nextStart, nextEnd;
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

                        $scope.previousEnabled = $routeParams.start > 0;

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

                        var start = ($routeParams.start + stepBy),
                            end = (($routeParams.end + stepBy < maxEnd) ? $routeParams.end + stepBy : maxEnd);
                        nextStart = start;
                        nextEnd = end;
                        var uriNext = $url.formatUri(
                            paths.site.ngRoutes.listen,
                            {
                                recordingId: recordingId,
                                start: start,
                                end: end
                            });

                        $scope.nextEnabled = $routeParams.end < $scope.model.audioRecording.durationSeconds - constants.listen.minAudioDurationSeconds;

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

                $scope.togglePlayState = function togglePlay() {
                    if ($scope.model.audioElement.isPlaying) {
                        $scope.model.audioElement.pause();
                    }
                    else {
                        $scope.model.audioElement.play();
                    }
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
