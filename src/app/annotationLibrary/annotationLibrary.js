angular.module('bawApp.annotationLibrary', ['bawApp.configuration'])

    .controller('AnnotationLibraryCtrl', ['$scope', '$location', '$resource', '$routeParams', 'conf.paths', 'conf.constants', 'bawApp.unitConverter', 'AudioEvent', 'Media', 'Tag',
        function ($scope, $location, $resource, $routeParams, paths, constants, unitConverter, AudioEvent, Media, Tag) {

            $scope.filterSettings = {
                tagsPartial: null,
                reference: '', // set to empty string to match value of radio button
                annotationDuration: null,
                freqMin: null,
                freqMax: null,
                page: null,
                items: null
            };

            loadFilter();

            $scope.setFilter = function setFilter() {
                $location.path('/library').search(createQuery($scope.filterSettings));
            };

            $scope.clearFilter = function clearFilter() {

                $scope.filterSettings = {
                    tagsPartial: null,
                    reference: '', // set to empty string to match value of radio button
                    annotationDuration: null,
                    freqMin: null,
                    freqMax: null,
                    page: null,
                    items: null
                };

                $scope.setFilter();
            };

            $scope.updateFilter = function updateFilter(filterSettings) {
                $scope.filterSettings = filterSettings;
                $scope.setFilter();
            };

            function createQuery(params) {
                var hash = {};
                for (var key in params) {
                    if (params.hasOwnProperty(key)) {
                        var value = params[key];
                        if (value !== undefined && value !== null && (typeof(value) === "string" ? value.length > 0 : true)) {
                            hash[key] = value;
                        }
                    }
                }
                //console.log(hash);
                return hash;
            }

            function getTag(tags) {
                return Tag.selectSinglePriorityTag(tags);
            }

            function calcOffsetStart(startOffset) {
                return Math.floor(startOffset / 30) * 30;
            }

            function calcOffsetEnd(startOffset) {
                return  (Math.floor(startOffset / 30) * 30) + 30;
            }

            function loadFilter() {
                $scope.filterSettings = angular.extend($scope.filterSettings, $routeParams);

                [
                    'annotationDuration',
                    'freqMin',
                    'freqMax',
                    'page',
                    'items'
                ].forEach(function (currentvalue, index, array) {
                        var stringValue = $scope.filterSettings[currentvalue];
                        $scope.filterSettings[currentvalue] = stringValue === null ? null : Number(stringValue);
                    });

                //$scope.filterSettings = $scope.createQuery($routeParams);
                $scope.library = AudioEvent.library($scope.filterSettings, null, function librarySuccess(value) {
                    value.entries.map(getMedia);

                    var pageCount = Math.max(Math.ceil($scope.library.total / $scope.library.items), 7);
                    $scope.paginationLinks = [];
                    for (var p = 1; p < pageCount; p++) {
                        var link = '/library?page=' + p + '&items=' + $scope.library.items;
                        $scope.paginationLinks.push(link);
                    }

                });
            }

            function getMediaParameters(value) {
                return {
                    start_offset: Math.floor(value.startTimeSeconds - constants.annotationLibrary.paddingSeconds),
                    end_offset: Math.ceil(value.endTimeSeconds + constants.annotationLibrary.paddingSeconds),
                    // this one is different, it is encoded into the path of the request by angular
                    recordingId: value.audioRecordingId,
                    format: "json"
                };
            }

            function getMedia(value, index, array) {
                Media
                    .get(getMediaParameters(value), null, function getMediaSuccess(mediaValue) {
                        // adds a media resource to each audio event
                        formatPaths(mediaValue);
                        value.media = mediaValue;

                        value.audioElement = null;

                        value.media.sampleRate = value.media.availableAudioFormats.mp3.sampleRate;

                        var audioRecordingIdValue = value.audioRecordingId;
                        var calcOffsetStartValue = calcOffsetStart(value.startTimeSeconds);
                        var calcOffsetEndValue = calcOffsetEnd(value.startTimeSeconds);

                        value.priorityTag = getTag(value.tags);


                        value.converters = unitConverter.getConversions({
                            sampleRate: value.media.sampleRate,
                            spectrogramWindowSize: value.media.availableImageFormats.png.window,
                            endOffset: value.media.endOffset,
                            startOffset: value.media.startOffset,
                            imageElement: null
                        });

                        value.bounds = {
                            top: value.converters.toTop(value.highFrequencyHertz),
                            left: value.converters.toLeft(value.startTimeSeconds),
                            width: value.converters.toWidth(value.endTimeSeconds, value.startTimeSeconds),
                            height: value.converters.toHeight(value.highFrequencyHertz, value.lowFrequencyHertz)
                        };

                        value.annotationDuration = value.endTimeSeconds - value.startTimeSeconds;

                        // urls
                        value.listenUrl = '/listen/' + audioRecordingIdValue
                            + '?start=' + calcOffsetStartValue
                            + '&end=' + calcOffsetEndValue;
                        value.siteUrl = '/projects/' + value.projects[0].id
                            + '/sites/' + value.siteId;
                        value.userUrl = '/user_accounts/' + value.ownerId;

                        // updateFilter({tagsPartial:item.priorityTag.text})
                        value.tagSearchUrl = '/library?tagsPartial=' +
                            baw.angularCopies.fixedEncodeURI(value.priorityTag.text);

                        // updateFilter({annotationDuration:Math.round10(value.annotationDuration, -3), ...})
                        value.similarUrl = '/library?annotationDuration=' + Math.round10(value.annotationDuration, -3)
                            + '&freqMin=' + Math.round(value.lowFrequencyHertz)
                            + '&freqMax=' + Math.round(value.highFrequencyHertz);

                        // set common/sensible defaults, but hide the elements
                        value.gridConfig = {
                            y: {
                                showGrid: true,
                                showScale: true,
                                max: value.converters.conversions.nyquistFrequency,
                                min: 0,
                                step: 1000,
                                height: value.converters.conversions.enforcedImageHeight,
                                labelFormatter: function (value, index, min, max) {
                                    return (value / 1000).toFixed(1);
                                },
                                title: "Frequency (KHz)"
                            },
                            x: {
                                showGrid: true,
                                showScale: true,
                                max: value.media.endOffset,
                                min: value.media.startOffset,
                                step: 1,
                                width: value.converters.conversions.enforcedImageWidth,
                                labelFormatter: function (value, index, min, max) {
                                    // show 'absolute' time.... i.e. seconds of the minute
                                    var offset = (value % 60);

                                    return (offset).toFixed(0);
                                },
                                title: "Time offset (seconds)"
                            }
                        };

                        //console.debug(value.media);
                    });
            }


            function formatPaths(media) {

                var imgKeys = Object.keys(media.availableImageFormats);
                if (imgKeys.length > 1) {
                    throw "don't know how to handle more than one image format!";
                }

                media.availableImageFormats[imgKeys[0]].url =
                    paths.joinFragments(
                        paths.api.root,
                        media.availableImageFormats[imgKeys[0]].url);

                angular.forEach(media.availableAudioFormats, function (value, key) {

                    // just update the url so it is an absolute uri
                    this[key].url = paths.joinFragments(paths.api.root, value.url);

                }, media.availableAudioFormats);
            };
        }]);