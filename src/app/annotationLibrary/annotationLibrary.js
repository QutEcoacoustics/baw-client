angular.module('bawApp.annotationLibrary', ['bawApp.configuration'])

    .controller('AnnotationLibraryCtrl', ['$scope', '$location', '$resource', '$routeParams', 'conf.paths', 'conf.constants', 'AudioEvent', 'Media',
        function ($scope, $location, $resource, $routeParams, paths, constants, AudioEvent, Media) {

            $scope.filterSettings = {
                tagsPartial: null,
                reference: null,
                annotationDuration: null,
                freqMin: null,
                freqMax: null,
                page: null,
                items: null
            };

            $scope.setFilter = function setFilter() {
                $location.path('/library').search($scope.createQuery($scope.filterSettings));
            };
            $scope.loadFilter = function loadFilter() {
                $scope.filterSettings = $scope.createQuery($routeParams);
                $scope.library = AudioEvent.library($scope.filterSettings, null, function librarySuccess(value) {
                    value.map(getMedia);
                });
            };
            $scope.createQuery = function createQuery(params) {
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
            };
            $scope.calcOffsetStart = function calcOffsetStart(startOffset) {
                return Math.floor(startOffset / 30) * 30;
            };
            $scope.calcOffsetEnd = function calcOffsetEnd(startOffset) {
                return  (Math.floor(startOffset / 30) * 30) + 30;
            };

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

            $scope.loadFilter();
        }]);