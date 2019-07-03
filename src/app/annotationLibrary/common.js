angular
    .module("bawApp.annotationLibrary.common", [])
    .factory(
    "annotationLibraryCommon",
    [
        "$url",
        "conf.paths",
        "conf.constants",
        "bawApp.unitConverter",
        "baw.models.associations",
        "Media",
        "baw.models.Media",
        "Tag",
        "AudioRecording",
        "Site",
        "Project",
        "UserProfile",
        "$q",
        function ($url, paths,
                  constants, unitConverter, modelAssociations,
                  Media, MediaModel, Tag, AudioRecording, Site, Project, UserService, $q) {

            var annotationToProjectLinker = modelAssociations.generateLinker("AudioEvent", "Project");
            var annotationToTagLinker = modelAssociations.generateLinker("AudioEvent", "Tag");
            const toMap = modelAssociations.arrayToMap;

            function createFilterUrl(paramObj) {
                return $url.formatUri(paths.site.ngRoutes.library, paramObj);
            }

            /**
             * For a given child model that has the properties startOffset, endOffset and AudioRecording,
             * fetch the Media json and add as a property. Child models are e.g. AudioEvent or DatasetItem.
             * @param childModel object
             * @return {*|Function}
             */
            function getMedia(childModel) {
                // modify annotation/datasetItem by reference
                // async
                var mediaParameters;
                if (childModel.constructor.name === "DatasetItem") {
                    mediaParameters = getDatasetItemMediaParameters(childModel);
                } else {
                    mediaParameters = getAnnotationMediaParameters(childModel);
                }


                var x = Media.get(
                    mediaParameters,
                    mediaGetSuccess.bind(null, childModel),
                    mediaGetFailure
                );

                return x.$promise;

            }

            function getAnnotationMediaParameters(audioEvent) {
                const recordingStart = 0.0,
                    padding = constants.annotationLibrary.paddingSeconds;

                // this depends on the audioRecording element being attached before this method is called
                var mediaDurationSeconds = Math.ceil(audioEvent.audioRecording.durationSeconds + padding);

                var startOffset = Math.max(
                    Math.floor(audioEvent.startTimeSeconds - padding),
                    recordingStart
                );

                var endOffset = Math.min(
                    Math.ceil(audioEvent.endTimeSeconds + padding),
                    mediaDurationSeconds
                );

                // in some cases the audioRecording is not available.
                // be "safe" and only request as much audio as we know exists
                if (!endOffset) {
                    endOffset = audioEvent.endTimeSeconds;
                }

                return {
                    recordingId: audioEvent.audioRecordingId,
                    audioEventId: audioEvent.id,
                    startOffset,
                    endOffset,
                    format: "json"
                };
            }

            function getDatasetItemMediaParameters(datasetItem) {

                var startOffset = datasetItem.startTimeSeconds;
                var endOffset = datasetItem.endTimeSeconds;

                return {
                    recordingId: datasetItem.audioRecordingId,
                    startOffset,
                    endOffset,
                    format: "json"
                };
            }



            function mediaGetSuccess(audioEvent, mediaValue, responseHeaders) {
                audioEvent.media = new MediaModel(mediaValue.data);

                // create properties that depend on Media

                // unit converters
                let converter = unitConverter.getConversions({
                    sampleRate: audioEvent.media.sampleRate,
                    spectrogramWindowSize: audioEvent.media.available.image.png.windowSize,
                    endOffset: audioEvent.media.endOffset,
                    startOffset: audioEvent.media.startOffset,
                    imageElement: null,
                    audioRecordingAbsoluteStartDate: audioEvent.media.recordedDate
                });

                // dimensions for the visuals
                audioEvent.bounds = {
                    top: converter.toTop(audioEvent.highFrequencyHertz),
                    left: converter.toLeft(audioEvent.startTimeSeconds),
                    width: converter.toWidth(audioEvent.endTimeSeconds,
                        audioEvent.startTimeSeconds),
                    height: converter.toHeight(audioEvent.highFrequencyHertz,
                        audioEvent.lowFrequencyHertz),
                    enforcedImageHeight: converter.conversions.enforcedImageHeight,
                    enforcedImageWidth: converter.conversions.enforcedImageWidth
                };


                audioEvent.gridConfig = getGridSettings(converter, audioEvent);
            }

            function getGridSettings(converter, audioEvent) {
                // set common/sensible defaults, but hide the elements
                var offsetOfDay = converter.input.audioRecordingAbsoluteStartDate.getSeconds();
                return {
                    y: {
                        showGrid: true,
                        showScale: true,
                        max: converter.conversions.nyquistFrequency,
                        min: 0,
                        step: 1000,
                        height: converter.conversions.enforcedImageHeight,
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
                        width: converter.conversions.enforcedImageWidth,
                        labelFormatter: function (value, index, min, max) {
                            // show 'absolute' time.... i.e. seconds of the minute
                            var offset = (value % 60);

                            return (offset).toFixed(0);
                        },
                        title: "Time (seconds)"
                    }
                };
            }

            function mediaGetFailure(httpResponse) {
                console.error("AnnotationLibrary:common:getMedia: Failed to get Media.", httpResponse);
            }

            return {
                createFilterUrl,
                getTags: function getTags({annotations, annotationIds, recordingIds}) {
                    if (annotations.length === 0) {
                        return null;
                    }

                    return Tag.getTagsByAudioIds(annotationIds).then(getTagsSuccess);

                    function getTagsSuccess(response) {
                        var tags = response.data.data;

                        // give every annotation an association with their tags
                        var tagLookup = toMap(tags);

                        // modify annotations by reference
                        annotations.forEach(annotation => {
                            annotationToTagLinker(annotation, {
                                Tag: tagLookup,
                                Tagging: new Map()
                            });

                            annotation.urls.tagSearch = createFilterUrl({
                                tagsPartial: annotation.priorityTag.text
                            });
                        });

                        return tags;
                    }
                },
                getUsers: function getUsers({annotations, annotationIds, recordingIds}) {
                    UserService
                        .getUsersByIdsForLinking(annotations.map(x => x.creatorId))
                        .then(usersResult => {
                            let users = toMap(usersResult.data.data);

                            // TODO: add this use case to associations.js
                            annotations.forEach((annotation) => {
                                annotation.creator = users.get(annotation.creatorId);
                            });
                        });
                },
                getSiteMediaAndProject: function getSiteMediaAndProject({annotations, annotationIds, recordingIds}) {
                    var arsp = {
                        audioRecordings: [],
                        sites: [],
                        projects: []
                    };

                    if (annotations.length === 0) {
                        return arsp;
                    }

                    return AudioRecording
                        .getRecordingsForLibrary(recordingIds)
                        .then(arResult => {
                            arsp.audioRecordings = arResult.data.data;
                            return arsp;
                        })
                        .then(function (arspData) {
                            if (arspData.audioRecordings.length === 0) {
                                return arspData;
                            }

                            return Site
                                .getSitesByIds(arspData.audioRecordings.map(x => x.siteId))
                                .then(sResult => {
                                    arspData.sites = sResult.data.data;
                                    return arspData;
                                });
                        })
                        .then(function (arspData) {
                            if (arspData.sites.length === 0) {
                                return arspData;
                            }

                            return Project
                                .getProjectsBySiteIds(arspData.sites.reduce((previous, x) => {
                                    return previous.concat(x.projectIds);
                                }, []))
                                .then(pResult => {
                                    arspData.projects = pResult.data.data;
                                    return arspData;
                                });
                        })
                        .then(projectAndSiteSuccess)
                        .catch((error) => {
                            console.error("annotationLibraryCommon::getSiteMediaAndProject promise resolution failed", error);
                        });

                    function projectAndSiteSuccess(arspData) {
                        var projects = toMap(arspData.projects),
                            sites = toMap(arspData.sites),
                            audioRecordings = toMap(arspData.audioRecordings);

                        var mediaPromises = [];

                        // modify annotations by reference and include them in the returned object
                        annotations.forEach(annotation => {
                            annotationToProjectLinker(annotation, {
                                Project: projects,
                                Site: sites,
                                AudioRecording: audioRecordings
                            });

                            mediaPromises.push(getMedia(annotation));
                        });

                        arspData.annotations = annotations;

                        return $q.all(mediaPromises).then(function () {
                            return arspData;
                        });


                    }
                },
                addCalculatedProperties: function addCalculatedProperties(audioEvent) {
                    audioEvent.gridConfig = {};

                    audioEvent.durationRounded = Math.round10(audioEvent.durationSeconds, -3);

                    var cds = constants.listen.chunkDurationSeconds;
                    audioEvent.calcOffsetStart = Math.floor(audioEvent.startTimeSeconds / cds) * cds;
                    audioEvent.calcOffsetEnd = (Math.floor(audioEvent.startTimeSeconds / cds) * cds) + cds;

                    audioEvent.urls = {};
                    audioEvent.urls.user = $url.formatUri(
                        paths.api.links.userAccountsAbsolute,
                        {
                            userId: audioEvent.creatorId
                        });

                    audioEvent.urls.isReference = createFilterUrl({reference: audioEvent.isReference});
                    audioEvent.urls.audioRecording = createFilterUrl({
                        audioRecordingId: audioEvent.audioRecordingId,
                        reference: "all"
                    });

                    audioEvent.urls.singleItem = $url.formatUri(
                        paths.site.ngRoutes.libraryItem,
                        {
                            recordingId: audioEvent.audioRecordingId,
                            audioEventId: audioEvent.id
                        });

                    audioEvent.urls.listen = $url.formatUri(
                        paths.site.ngRoutes.listen,
                        {
                            recordingId: audioEvent.audioRecordingId,
                            start: audioEvent.calcOffsetStart,
                            end: audioEvent.calcOffsetEnd
                        });

                    audioEvent.urls.listenWithoutPadding = $url.formatUri(
                        paths.site.ngRoutes.listen,
                        {
                            recordingId: audioEvent.audioRecordingId,
                            start: audioEvent.startTimeSeconds,
                            end: audioEvent.endTimeSeconds
                        });

                    return audioEvent;
                }

            };
        }]);