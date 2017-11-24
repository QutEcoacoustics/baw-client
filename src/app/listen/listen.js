angular
    .module("bawApp.listen", ["decipher.tags", "ui.bootstrap.typeahead"])
    .controller(
        "ListenCtrl",
        [
            "$scope",
            "$resource",
            "$location",
            "$routeParams",
            "$route",
            "$q",
            "conf.paths",
            "conf.constants",
            "$url",
            "lodash",
            "d3",
            "ngAudioEvents",
            "AudioRecording",
            "baw.models.AudioRecording",
            "Media",
            "baw.models.Media",
            "AudioEvent",
            "Tag",
            "baw.models.Tag",
            "Taggings",
            "Site",
            "Project",
            "UserProfile",
            "UserProfileEvents",
            "Bookmark",
            "moment",
            "growl",
            function ListenController($scope, $resource, $location, $routeParams, $route, $q, paths, constants, $url,
                                      _, d3, ngAudioEvents, AudioRecording, AudioRecordingModel, MediaService, Media, AudioEvent, Tag,
                                      TagModel, Taggings, Site, Project, UserProfile, UserProfileEvents, Bookmark,
                                      moment, growl) {
                const ChunkDurationSettings = constants.listen.chunkDurationSeconds;
                const HideAnnotationsKey = "hideAnnotations";

                let dateFormatter = d3.time.format(constants.localization.dateTimeFormatD3);

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
                    $routeParams.end = parseFloat($routeParams.end) || ($routeParams.start + ChunkDurationSettings);
                    var chunkDuration = ($routeParams.end - $routeParams.start);
                    if (chunkDuration < 0) {

                        $routeParams.start = 0.0;
                        console.warn(
                            "invalid start offsets specified, reverting to safe value: start=" + $routeParams.start);
                    }
                    if (chunkDuration > ChunkDurationSettings) {
                        $routeParams.end = $routeParams.start + ChunkDurationSettings;
                        console.warn("invalid end offsets specified, reverting to safe value: end=" + $routeParams.end);
                    }
                    var hideAnnotations = $routeParams[HideAnnotationsKey] === true;

                    if (hideAnnotations) {
                        console.warn("Existing annotations will be not be shown.");
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
                            $scope.$apply(function () {
                                var search = {autoPlay: true, start: nextStart, end: nextEnd};

                                if (hideAnnotations) {
                                    search[HideAnnotationsKey] = true;
                                }

                                $location.search(search);
                            });
                        }
                        else {
                            console.warn("Continuous playback cannot continue");
                        }
                    });
                    $scope.$watch(function () {
                        return $scope.model.audioElement.autoPlay;
                    }, function (newValue, oldValue) {
                        if (UserProfile.profile && (UserProfile.profile.preferences.autoPlay !== newValue)) {
                            $scope.$emit("autoPlay", newValue);
                        }
                    });

                    // update urls on login events
                    $scope.$on("event:auth-loginRequired", function () {
                        if ($scope.model.media) {
                            $scope.model.media.formatPaths();
                        }
                    });
                    $scope.$on("event:auth-loginConfirmed", function () {
                        if ($scope.model.media) {
                            $scope.model.media.formatPaths();
                        }
                    });

                    var media = MediaService
                        .get(
                            {
                                recordingId: $routeParams.recordingId,
                                start_offset: $routeParams.start,
                                end_offset: $routeParams.end,
                                format: "json"
                            },
                            function mediaGetSuccess(value, responseHeaders) {
                                $scope.model.media = new Media(value.data);

                                var // moment works by reference - need to parse the date twice - sigh
                                    absoluteStartChunk = moment($scope.model.media.recordedDate).add(
                                        parseFloat($scope.model.media.startOffset), "s"),
                                    absoluteEndChunk = moment($scope.model.media.recordedDate).add(
                                        parseFloat($scope.model.media.endOffset), "s");

                                $scope.startOffsetAbsolute = absoluteStartChunk.format("HH:mm:ss");
                                $scope.endOffsetAbsolute = absoluteEndChunk.format("HH:mm:ss");
                                $scope.downloadAnnotationsLink = AudioEvent.csvLink(
                                    {
                                        recordingId: $scope.model.media.recording.id,
                                        startOffset: $scope.model.media.commonParameters.startOffset,
                                        endOffset: $scope.model.media.commonParameters.endOffset
                                    });

                            },
                            function mediaGetFailure() {
                                console.error("retrieval of media json failed");
                            });


                    // bookmarks
                    $q
                        .all([Bookmark.applicationBookmarksPromise, media.$promise])
                        .then(
                            function () {
                                Bookmark.savePlaybackPosition(
                                    $scope.model.media.recording.id,
                                    $scope.model.media.commonParameters.startOffset);
                            },
                            function () {
                                console.error("Bookmark saving error", arguments);
                            });


                    var getAudioRecording = function getAudioRecording(recordingId) {
                        var deferred = $q.defer();

                        AudioRecording.get({recordingId: recordingId}, {},
                            function audioRecordingGetSuccess(value) {
                                // if an audioRecording 'model' is ever created, this is where we would transform the
                                // returned data
                                $scope.model.audioRecording = new AudioRecordingModel(value.data);

                                var result = {audioRecording: $scope.model.audioRecording};

                                // set up jumpto vars
                                var maxMinutes = Math.floor(
                                    parseFloat($scope.model.audioRecording.durationSeconds) / 60);
                                $scope.jumpToMax = maxMinutes;
                                $scope.jumpToMinute = Math.floor(parseFloat($routeParams.start) / 60);
                                $scope.jumpToHide = false;

                                $scope.model.audioRecording.recordedDateFormatted = dateFormatter(
                                    $scope.model.audioRecording.recordedDate);
                                $scope.model.audioRecording.recordedEndDateFormatted = dateFormatter(
                                    $scope.model.audioRecording.recordedEndDate);

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
                            var data = value.data;
                            data.links = data.projectIds.map(function (id, index) {
                                return paths.api.routes.site.nestedAbsolute.format({
                                    "siteId": data.id,
                                    "projectId": id
                                });
                            });

                            data.visualizeLink = $url.formatUri(paths.site.ngRoutes.visualize, {siteId: data.id},
                                x => x);

                            $scope.model.site = data;
                            result.site = data;
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
                                var data = value.data;
                                data.link = paths.api.routes.project.showAbsolute.format({"projectId": data.id});
                                data.visualizeLink = $url.formatUri(paths.site.ngRoutes.visualize, {projectId: data.id},
                                    x => x);

                                $scope.model.projects[index] = data;
                                result.projects[index] = data;

                                projectDeferred.resolve(result);
                            }, function getProjectError(error) {
                                if (error.status === 403) {
                                    console.warn(
                                        "The project %s does not give permissions to current user to access it's content. There are %s projects.",
                                        id, result.site.projectIds.length);
                                    // populate field anyway, not really sure what to do here, temp value added
                                    var denied = {
                                        id: id,
                                        permissions: "access denied"
                                    };

                                    denied.link = paths.api.routes.project.showAbsolute.format(
                                        {"projectId": denied.id});

                                    $scope.model.projects[index] = denied;
                                    result.projects[index] = denied;

                                    // we don't mind that this "error" has occurred - there should be at least one
                                    // project that did resolve. Resolve promise anyway
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
                    getAudioRecording(recordingId)
                        .then(getSite)
                        .then(getProjects)
                        .then(function success(result) {
                            console.info("Metadata Promise chain success", result);
                        }, function error(err) {
                            console.error("An error occurred downloading metadata for this chunk:" + err, err);
                        }, function notify() {
                            // TODO: remove dodgy scope closure from promise functions, and update values here
                            // incrementally!
                            console.debug("All promises notify", arguments);
                        });


                    AudioEvent.getAudioEventsWithinRange(
                        recordingId,
                        [$routeParams.start, $routeParams.end])
                        .then(function audioEventsQuerySuccess(response) {
                                let items = response.data.data;

                                items = items.map(x => new baw.Annotation(x));

                                if (hideAnnotations) {
                                    console.warn(
                                        "Audio events loaded but not included in model because hideAnnotations==true, count:",
                                        items.length);
                                }
                                else {
                                    $scope.model.audioEvents = items;

                                    $scope.model.audioEvents.forEach(function (value) {
                                        Tag.resolveAll(value.tags, $scope.tags);
                                    });
                                }
                            },
                            function audioEventQueryFailure() {
                                console.error("retrieval of audio events failed");
                            });

                    // download all the tags and store them in Tag service cache
                    // TODO: this is inefficient, make better in the future...
                    $scope.tags = [];
                    Tag.query({disable_paging: true}, {},
                        function success(value) {
                            var tags = value.data;
                            tags.forEach(function (item) {
                                $scope.tags.push(TagModel.make(item));
                            });

                            $scope.model.audioEvents.forEach(function (item) {
                                Tag.resolveAll(item.tags, $scope.tags);
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
                        return baw.secondsToDurationFormat(
                            $scope.model.media.endOffset - $scope.model.media.startOffset);
                    };

                    $scope.endRecordingAbsolute = function () {
                        if (!$scope.model.audioRecording) {
                            return undefined;
                        }
                        return moment($scope.model.audioRecording.recordedDate).add(
                            $scope.model.audioRecording.durationSeconds, "s").format("YYYY-MMM-DD, HH:mm:ss");
                    };


                    $scope.currentOffsetChunk = function () {
                        var offset = 0;
                        if ($scope.model.audioElement) {
                            offset = $scope.model.audioElement.position;
                        }
                        return baw.secondsToDurationFormat(offset);
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
                            absolute = baseDate.add(recordingOffset + chunkOffset, "s");

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

                        return moment($scope.model.media.recordedDate).add($scope.jumpToMinute, "m").format(
                            "YYYY-MMM-DD, HH:mm:ss");
                    };


                    $scope.previousLink = function () {
                        return $scope.createNavigationHref("previous");
                    };
                    $scope.nextLink = function () {
                        return $scope.createNavigationHref("next");
                    };


                    // hacky hack for continuous playback
                    var nextStart, nextEnd;
                    $scope.createNavigationHref = function (linkType, stepBy) {
                        // skip if resources not available
                        if (!$scope.model.audioRecording) {
                            return "";
                        }

                        if (!angular.isNumber(stepBy)) {
                            stepBy = ChunkDurationSettings;
                        }

                        var baseLink = {recordingId: recordingId};

                        if (hideAnnotations) {
                            baseLink[HideAnnotationsKey] = true;
                        }

                        if (linkType === "previous") {
                            var lowerBound = ($routeParams.start - stepBy);
                            var uriPrev;

                                // no previous link if we are at the start
                            if ($routeParams.start <= 0) {
                                uriPrev = "";
                            } else {
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

                                uriPrev = $url.formatUri(
                                    paths.site.ngRoutes.listen,
                                    baseLink);
                            }

                            return uriPrev;

                        }
                        else if (linkType === "next") {

                            var maxEnd = Math.floor($scope.model.audioRecording.durationSeconds);

                            baseLink.start = ($routeParams.start + stepBy);
                            baseLink.end = (($routeParams.end + stepBy < maxEnd) ? $routeParams.end + stepBy : maxEnd);
                            nextStart = baseLink.start;
                            nextEnd = baseLink.end;
                            var uriNext = $url.formatUri(
                                paths.site.ngRoutes.listen,
                                baseLink
                            );


                            var nextEnabled = $routeParams.end < $scope.model.audioRecording.durationSeconds - constants.listen.minAudioDurationSeconds;
                            // keep this value for autoplay
                            $scope.nextEnabled = nextEnabled;

                            if (!nextEnabled) {
                                uriNext = "";
                            }

                            return uriNext;
                        }

                        throw "Invalid link type specified in createNavigationHref";
                    };

                    $scope.jumpTo = function () {
                        var maxEnd = Math.floor($scope.model.audioRecording.durationSeconds),
                            seconds = $scope.jumpToMinute * 60;
                        if (seconds < 0) {
                            seconds = 0;
                        }
                        if (seconds > (maxEnd - ChunkDurationSettings)) {
                            seconds = (maxEnd - ChunkDurationSettings);
                        }
                        var params = {
                            recordingId: recordingId,
                            start: seconds,
                            end: seconds + ChunkDurationSettings
                        };

                        if (hideAnnotations) {
                            params[HideAnnotationsKey] = true;
                        }

                        var url = $url.formatUri(
                            paths.site.ngRoutes.listen,
                            params
                        );

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

                    var hackIndexOf = function hackIndexOf(event) {
                        // do hyper hacky hack to fix dodgy ass library
                        // see: https://github.com/QutBioacoustics/baw-client/issues/227
                        event.targetScope.srcTags.indexOf = function myOwnHackyIndexOf(item) {
                            if (item.name) {
                                return this.findIndex(c => c.text === item.name);
                            }
                            else {
                                // revert back to the standard implementation
                                return Array.prototype.indexOf.call(this, item);
                            }
                        };
                    };

                    var hackyCleaningOfFakeTags = function (arr) {
                        arr.forEach(function (current, index) {
                            if (!(current instanceof TagModel)) {
                                var real = $scope.tags.find(c => c.text === current.name);
                                arr[index] = real;
                            }
                        });
                    };

                    $scope.$on("decipher.tags.initialized", function (event) {
                        event.stopPropagation();

                        hackIndexOf(event);

                        console.debug("decipher.tags.initialized", arguments);
                    });
                    $scope.$on("decipher.tags.keyup", function (event) {
                        hackIndexOf(event);
                        event.stopPropagation();
                        console.debug("decipher.tags.keyup", arguments);
                    });
                    $scope.$on("decipher.tags.added", function (event, addedTag) {
                        hackIndexOf(event);
                        event.stopPropagation();
                        console.debug("decipher.tags.added", arguments);

                        var taggingParameters = {
                            recordingId: recordingId,
                            audioEventId: $scope.model.selectedAudioEvent.id
                        };

                        var index = $scope.model.selectedAudioEvent.tags.length; //.indexOf(addedTag.tag);

                        // HACK: find a proper tag when the tag is fake tag
                        if (!addedTag.tag.id) {
                            var actualTagIndex = $scope.tags.findIndex(c => c.text === addedTag.tag.name);
                            addedTag.tag = $scope.tags[actualTagIndex];
                            // MORE HACKS! repair its cache of deleted fake tags as well
                            hackyCleaningOfFakeTags(event.targetScope._deletedSrcTags);
                            hackyCleaningOfFakeTags(event.targetScope.tags);
                        }

                        Taggings.save(taggingParameters, {tagId: addedTag.tag.id},
                            function success(value, headers) {

                                // possible race condition: may no longer may be selected after async
                                $scope.model.selectedAudioEvent.taggings[index] = new baw.Tagging(value.data);
                                $scope.model.selectedAudioEvent.tags[index] = addedTag.tag;

                                console.assert(
                                    $scope.model.selectedAudioEvent.tags.length ===
                                    $scope.model.selectedAudioEvent.taggings.length,
                                    "The taggings array and tags array are out of sync, this is bad");

                                console.debug("Tag addition success", addedTag.tag.text);
                            },
                            function error(response) {
                                console.error("Tagging creation failed", response);
                                growl.error(
                                    "Adding a tag to an annotation has failed. Please refresh the page. If you see this message often please let us know.");
                            });
                    });
                    $scope.$on("decipher.tags.addfailed", function (event) {
                        hackIndexOf(event);
                        event.stopPropagation();
                        console.debug("decipher.tags.addfailed", arguments);
                    });
                    $scope.$on("decipher.tags.removed", function (event, removedTag) {
                        hackIndexOf(event);
                        event.stopPropagation();
                        console.debug("decipher.tags.removed", arguments);

                        var index = _.findIndex($scope.model.selectedAudioEvent.taggings, function (value) {
                            return value.tagId === removedTag.tag.id;
                        });
                        var oldTagging = $scope.model.selectedAudioEvent.taggings[index];

                        var taggingParameters = {
                            recordingId: recordingId,
                            audioEventId: $scope.model.selectedAudioEvent.id,
                            taggingId: oldTagging.id
                        };

                        console.assert(
                            $scope.model.selectedAudioEvent.tags.length ===
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
                                growl.error(
                                    "Removing a tag from an annotation has failed. Please refresh the page. If you see this message often please let us know.");
                            }
                        )
                        ;
                    });
                }


            }
        ]
    );
