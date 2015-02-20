var baw = window.baw = window.baw || {};

function dontRenameKeys(key) {
    return key;
}

baw.annotationLibrary = {};
baw.annotationLibrary.addCalculatedProperties = function addCalculatedProperties(audioEvent, $url, paths) {

    audioEvent.annotationDuration = audioEvent.endTimeSeconds - audioEvent.startTimeSeconds;
    audioEvent.annotationDurationRounded = Math.round10(audioEvent.endTimeSeconds - audioEvent.startTimeSeconds, -3);
    audioEvent.annotationFrequencyRange = audioEvent.highFrequencyHertz - audioEvent.lowFrequencyHertz;
    audioEvent.calcOffsetStart = Math.floor(audioEvent.startTimeSeconds / 30) * 30;
    audioEvent.calcOffsetEnd = (Math.floor(audioEvent.startTimeSeconds / 30) * 30) + 30;

    var roundedDuration = Math.round10(audioEvent.annotationDuration, -3);
    var roundedFreqLow = Math.round(audioEvent.lowFrequencyHertz);
    var roundedFreqHigh = Math.round(audioEvent.highFrequencyHertz);

    audioEvent.urls = {
        site: $url.formatUri(paths.api.links.siteAbsolute, {projectId: audioEvent.projects[0].id, siteId: audioEvent.siteId}, dontRenameKeys),
        user: $url.formatUri(paths.api.links.userAccountsAbsolute, {userId: audioEvent.ownerId}, dontRenameKeys),
        tagSearch: $url.formatUri(paths.site.ngRoutes.libraryAbsolute, {tagsPartial: audioEvent.priorityTag.text}, dontRenameKeys),
        isReference: $url.formatUri(paths.site.ngRoutes.libraryAbsolute, {reference: audioEvent.isReference}),
        similar: $url.formatUri(paths.site.ngRoutes.libraryAbsolute,
            {
                annotationDuration: roundedDuration,
                freqMin: roundedFreqLow,
                freqMax: roundedFreqHigh
            }, dontRenameKeys),
        singleItem: $url.formatUri(paths.site.ngRoutes.libraryItem,
            {
                recordingId: audioEvent.audioRecordingId,
                audioEventId:  audioEvent.audioEventId
            }, dontRenameKeys),
        listen: $url.formatUri(paths.site.ngRoutes.listen,
            {
                recordingId: audioEvent.audioRecordingId,
                start: audioEvent.calcOffsetStart,
                end: audioEvent.calcOffsetEnd
            }, dontRenameKeys),
        listenWithoutPadding: $url.formatUri(paths.site.ngRoutes.listen,
            {
                recordingId: audioEvent.audioRecordingId,
                start: audioEvent.startTimeSeconds,
                end: audioEvent.endTimeSeconds
            }, dontRenameKeys)
    };

    audioEvent.tags.forEach(
        function (currentvalue, index, array) {
            currentvalue.similarPartial = $url.formatUri(paths.site.ngRoutes.libraryAbsolute,
                {
                    tagsPartial: currentvalue.text,
                    annotationDuration: roundedDuration,
                    freqMin: roundedFreqLow,
                    freqMax: roundedFreqHigh
                });
        }
    );

    audioEvent.projects.forEach(
        function (currentvalue, index, array) {
            currentvalue.link = $url.formatUri(paths.api.links.projectAbsolute, {projectId: currentvalue.id});
        }
    );


    return audioEvent;
};

baw.annotationLibrary.getBoundSettings = function getBoundSettings(audioEvent, constants, unitConverter, MediaService, Media) {

    var minDuration = 0;
    var audioDurationSeconds =
        Math.floor(audioEvent.audioRecordingDurationSeconds) ||
        (Math.ceil(audioEvent.endTimeSeconds + constants.annotationLibrary.paddingSeconds));

    var mediaItemParameters = {
        recordingId: audioEvent.audioRecordingId,
        audioEventId: audioEvent.id,
        start_offset: Math.max(Math.floor(audioEvent.startTimeSeconds - constants.annotationLibrary.paddingSeconds), minDuration),
        end_offset: Math.min(Math.ceil(audioEvent.endTimeSeconds + constants.annotationLibrary.paddingSeconds), audioDurationSeconds),
        format: "json"
    };

    MediaService.get(
        mediaItemParameters,
        function mediaGetSuccess(mediaValue, responseHeaders) {

            audioEvent.media = mediaValue = new Media(mediaValue.data);

            // create properties that depend on Media
            audioEvent.converters = unitConverter.getConversions({
                sampleRate: audioEvent.media.sampleRate,
                spectrogramWindowSize: audioEvent.media.available.image.png.windowSize,
                endOffset: audioEvent.media.endOffset,
                startOffset: audioEvent.media.startOffset,
                imageElement: null,
                audioRecordingAbsoluteStartDate: audioEvent.media.recordedDate
            });

            audioEvent.bounds = {
                top: audioEvent.converters.toTop(audioEvent.highFrequencyHertz),
                left: audioEvent.converters.toLeft(audioEvent.startTimeSeconds),
                width: audioEvent.converters.toWidth(audioEvent.endTimeSeconds, audioEvent.startTimeSeconds),
                height: audioEvent.converters.toHeight(audioEvent.highFrequencyHertz, audioEvent.lowFrequencyHertz)
            };

            // set common/sensible defaults, but hide the elements
            var offsetOfDay = audioEvent.converters.input.audioRecordingAbsoluteStartDate.getSeconds();
            audioEvent.gridConfig = {
                y: {
                    showGrid: true,
                    showScale: true,
                    max: audioEvent.converters.conversions.nyquistFrequency,
                    min: 0,
                    step: 1000,
                    height: audioEvent.converters.conversions.enforcedImageHeight,
                    labelFormatter: function (value, index, min, max) {
                        return (value / 1000).toFixed(1);
                    },
                    title: "Frequency (KHz)"
                },
                x: {
                    showGrid: true,
                    showScale: true,
                    max: offsetOfDay + audioEvent.media.endOffset,
                    min: offsetOfDay + audioEvent.media.startOffset,
                    step: 1,
                    width: audioEvent.converters.conversions.enforcedImageWidth,
                    labelFormatter: function (value, index, min, max) {
                        // show 'absolute' time.... i.e. seconds of the minute
                        var offset = (value % 60);

                        return (offset).toFixed(0);
                    },
                    title: "Time (seconds)"
                }
            };


        }, function mediaGetFailure(httpResponse) {
            console.error("Failed to get Media.", httpResponse);
        }
    );

    return audioEvent;
};

angular.module('bawApp.annotationLibrary', ['bawApp.configuration'])
    .controller('AnnotationLibraryCtrl', ['$scope', '$location', '$resource', '$routeParams', '$url',
        'conf.paths', 'conf.constants', 'bawApp.unitConverter',
        'AudioEvent', 'Tag', 'Media', 'baw.models.Media',
        function ($scope, $location, $resource, $routeParams, $url, paths, constants, unitConverter, AudioEvent, Tag, MediaService, Media) {

            $scope.status = 'idle';

            $scope.filterSettings = getEmptyFilterSettings();

            loadFilter();

            $scope.setFilter = function setFilter() {
                $location.path('/library').search($url.toKeyValue($scope.filterSettings, true, dontRenameKeys));
            };

            $scope.clearFilter = function clearFilter() {
                $scope.filterSettings = getEmptyFilterSettings();
                $scope.setFilter();
            };

            $scope.searchFilter = function searchFilter() {
                // reset page number on search
                $scope.filterSettings.page = 1;

                $scope.setFilter();
            };

            $scope.updateFilter = function updateFilter(filterSettings) {
                $scope.filterSettings = filterSettings;
                $scope.setFilter();
            };


            $scope.createFilterUrl = function createFilterUrl(paramObj) {
                return $url.formatUri(paths.site.ngRoutes.libraryAbsolute, paramObj, dontRenameKeys);
            };

            function getEmptyFilterSettings() {
                return {
                    tagsPartial: null,
                    reference: 'true', // set to empty string to match value of radio button
                    userId: null,
                    audioRecordingId: null,
                    annotationDuration: null,
                    freqMin: null,
                    freqMax: null,
                    page: null,
                    items: null
                };
            }

            function normaliseFilterSettings() {
                $scope.filterSettings = angular.extend({}, $scope.filterSettings, $routeParams);

                // ensure properties that need to be numeric are actually numbers
                [
                    'annotationDuration',
                    'freqMin',
                    'freqMax',
                    'page',
                    'items',
                    'userId',
                    'audioRecordingId'
                ].forEach(
                    function (currentvalue, index, array) {
                        var stringValue = $scope.filterSettings[currentvalue];
                        var isVoid = stringValue === null || stringValue === undefined || stringValue === "";
                        $scope.filterSettings[currentvalue] = isVoid ? null : Number(stringValue);
                    }
                );

                // disable other options for reference filter
                $scope.filterSettings.reference = 'true';
            }

            function getPagingSettings(page, items, total) {
                var paging = {
                    maxPageLinks: 7,
                    surroundingCurrentLinks: 3,
                    minPageNumber: 1,
                    total: total,
                    items: items,
                    page: page
                };

                paging.maxPageNumber = Math.ceil(paging.total / paging.items);
                paging.minCount = Math.max(paging.page - paging.surroundingCurrentLinks, paging.minPageNumber);
                paging.maxCount = Math.min(paging.page + paging.surroundingCurrentLinks, paging.maxPageNumber);

                // make accessing links easy via properties, rather than having to use array indexing
                paging.links = {};

                paging.links.first =
                    $scope.createFilterUrl(
                        angular.extend({}, $scope.filterSettings,
                            {page: paging.minPageNumber, items: paging.items})
                    );

                paging.links.prev =
                    $scope.createFilterUrl(
                        angular.extend({}, $scope.filterSettings,
                            {page: Math.max(paging.page - 1, paging.minPageNumber), items: paging.items})
                    );

                paging.links.current =
                    $scope.createFilterUrl(
                        angular.extend({}, $scope.filterSettings,
                            {page: paging.page, items: paging.items})
                    );

                paging.links.next =
                    $scope.createFilterUrl(
                        angular.extend({}, $scope.filterSettings,
                            {page: Math.min(paging.page + 1, paging.maxPageNumber), items: paging.items})
                    );

                paging.links.last =
                    $scope.createFilterUrl(
                        angular.extend({}, $scope.filterSettings,
                            {page: paging.maxPageNumber, items: paging.items})
                    );

                paging.links.before = [];
                paging.links.after = [];

                for (var p = paging.minCount; p <= paging.maxCount; p++) {
                    if (p != paging.page && p != paging.minPageNumber && p != paging.maxPageNumber) {
                        var linkObj = angular.extend({}, $scope.filterSettings, {page: p, items: paging.items});
                        var link = $scope.createFilterUrl(linkObj);
                        if (p < paging.page) {
                            paging.links.before.push({page: p, link: link});
                        } else {
                            paging.links.after.push({page: p, link: link});
                        }
                    }
                }

                return paging;
            }

            function loadFilter() {
                $scope.status = 'loading';

                normaliseFilterSettings();

                AudioEvent.library($scope.filterSettings, null, function librarySuccess(value, responseHeaders) {

                    $scope.status = 'loaded';
                    $scope.responseDetails = responseHeaders;
                    $scope.paging = getPagingSettings(value.page, value.items, value.total);
                    $scope.annotations = [];

                    angular.forEach(value.entries, function (audioEventValue, key) {
                        var annotation = angular.extend({}, audioEventValue);
                        annotation.priorityTag = Tag.selectSinglePriorityTag(annotation.tags);
                        baw.annotationLibrary.addCalculatedProperties(annotation, $url, paths);
                        baw.annotationLibrary.getBoundSettings(annotation, constants, unitConverter, MediaService, Media);
                        this.push(annotation);
                    }, $scope.annotations);

                }, function libraryError(httpResponse) {
                    $scope.status = 'error';
                    console.error('Failed to load library response.', $scope.filterSettings, httpResponse);
                });
            }
        }])
    .controller('AnnotationItemCtrl',
    ['$scope', '$location', '$resource', '$routeParams', '$url',
        'conf.paths', 'conf.constants', 'bawApp.unitConverter', 'moment',
        'AudioEvent', 'Tag',
        'Media', 'baw.models.Media', 'UserProfileEvents', 'UserProfile', 'AudioEventComment',
        function ($scope, $location, $resource, $routeParams, $url,
                  paths, constants, unitConverter, moment,
                  AudioEvent, Tag,
                  MediaService, Media, UserProfileEvents, UserProfile, AudioEventComment) {

            $scope.$on(UserProfileEvents.loaded, profileLoaded);
            if (UserProfile.profile && UserProfile.profile.preferences) {
                profileLoaded(null, UserProfile);
            }


            var parameters = {
                audioEventId: $routeParams.audioEventId,
                recordingId: $routeParams.recordingId
            };

            // new comment text and errors
            $scope.newComment = {
                // bind to new comment textarea
                text: '',
                errors: []
            };

            $scope.editComment = {
                id: null,
                text: null,
                errors: []
            };

            AudioEvent.get(parameters,
                function annotationShowSuccess(audioEventValue, responseHeaders) {

                    var annotation = angular.extend({}, audioEventValue);
                    annotation.priorityTag = Tag.selectSinglePriorityTag(annotation.tags);
                    baw.annotationLibrary.addCalculatedProperties(annotation, $url, paths);
                    baw.annotationLibrary.getBoundSettings(annotation, constants, unitConverter, MediaService, Media);

                    $scope.annotation = annotation;
                    $scope.annotation.gridConfig = {};


                    // comments
                    reloadComments();

                    // paging
                    if ($scope.annotation.paging.nextEvent.hasOwnProperty('audioEventId')) {
                        $scope.annotation.paging.nextEvent.link =
                            $url.formatUri(
                                paths.site.ngRoutes.libraryItemAbsolute,
                                {
                                    recordingId: $scope.annotation.paging.nextEvent.audioRecordingId,
                                    audioEventId: $scope.annotation.paging.nextEvent.audioEventId
                                },
                                dontRenameKeys
                            );
                    }

                    if ($scope.annotation.paging.prevEvent.hasOwnProperty('audioEventId')) {
                        $scope.annotation.paging.prevEvent.link =
                            $url.formatUri(
                                paths.site.ngRoutes.libraryItemAbsolute,
                                {
                                    recordingId: $scope.annotation.paging.prevEvent.audioRecordingId,
                                    audioEventId: $scope.annotation.paging.prevEvent.audioEventId
                                },
                                dontRenameKeys
                            );
                    }
                }, function annotationShowError(httpResponse) {
                    console.error('Failed to load library single item response.', parameters, httpResponse);
                });

            $scope.createFilterUrl = function createFilterUrl(paramObj) {
                return $url.formatUri(paths.site.ngRoutes.libraryAbsolute, paramObj, dontRenameKeys);
            };

            $scope.createProjectUrl = function createProjectUrl(projectId){
                return $url.formatUri(paths.api.links.projectAbsolute, {projectId: projectId}, dontRenameKeys);
            };

            $scope.createCommentLinkUrl = function createCommentLinkUrl(audioEventCommentId) {
                return '/library/' + $routeParams.recordingId + '/audio_events/' +
                    $routeParams.audioEventId + '#' + audioEventCommentId
            };

            $scope.formatTimeAgo = function formatTimeAgo(date) {
                if (date) {
                    return moment(date).fromNow();
                }
                else {
                    return "unknown";
                }
            };

            $scope.createComment = function createComment() {
                if($scope.createCommentForm.$valid) {
                    AudioEventComment.save(
                        {audioEventId: $routeParams.audioEventId}, // parameters
                        {comment: $scope.newComment.text}, // post data
                        function createCommentSuccess(value, responseHeaders) {
                            console.log('create success', arguments);
                            $scope.newComment.errors = [];
                            $scope.newComment.text = '';
                            reloadComments();
                        },
                        function createCommentError(httpResponse) {
                            console.log('create failure', arguments);
                            $scope.newComment.errors = httpResponse.data.comment;
                        });
                }
            };

            $scope.deleteComment = function deleteComment(commentText, audioEventCommentId) {
                var isConfirmed = confirm('Are you sure you want to delete this comment? "' + commentText + '"');
                if (isConfirmed === true) {
                    AudioEventComment.delete(
                        {
                            audioEventId: $routeParams.audioEventId,
                            audioEventCommentId: audioEventCommentId
                        }, // parameters
                        null, // post data
                        function deleteCommentSuccess(value, responseHeaders) {
                            console.log('delete success', arguments);
                            $scope.newComment.errors = [];
                            $scope.newComment.text = '';
                            reloadComments();
                        },
                        function deleteCommentError(httpResponse) {
                            console.log('delete failure', arguments);
                            $scope.newComment.errors = httpResponse.data.comment;
                        });
                }
            };

            function updateCommentBase(id, body) {
                AudioEventComment.update(
                    // url parameters
                    {
                        audioEventId: $routeParams.audioEventId,
                        audioEventCommentId: id
                    },
                    // body
                    body,
                    function updateCommentSuccess(value, responseHeaders) {
                        console.log('update success', arguments);
                        $scope.editComment.errors = [];
                        $scope.editComment.text = null;
                        $scope.editComment.id = null;
                        reloadComments();
                    },
                    function updateCommentError(httpResponse) {
                        console.log('update failure', arguments);
                        $scope.editComment.errors = httpResponse.data.comment;
                    });
            }

            $scope.updateComment = function updateComment(comment, updateForm) {
                if(updateForm.$valid) {
                    updateCommentBase(comment.id, {
                        comment: comment.comment
                    });
                    comment.editing = false;
                }
            };

            $scope.editComment = function editComment(comment) {
                comment.editing = true;
            };

            $scope.reportComment = function reportComment(comment) {
                comment.flag = "report";
                updateCommentBase(comment.id, {
                                      flag: comment.flag
                                  });

            };

            function profileLoaded(event, userProfile) {
                $scope.profile = userProfile.profile;
            }

            function reloadComments() {
                // get array of comment for the current audio event
                AudioEventComment.query(
                    {audioEventId: $routeParams.audioEventId},
                    function audioEventCommentSuccess(value, responseHeaders) {
                        $scope.comments = value.data;

                        $scope.comments.forEach(function(value) {

                        });
                    });

            }

        }]);