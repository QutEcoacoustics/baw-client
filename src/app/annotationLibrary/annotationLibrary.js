angular.module('bawApp.annotationLibrary', ['bawApp.configuration'])
    .controller('AnnotationLibraryCtrl', ['$scope', '$location', '$resource', '$routeParams', '$url', 'conf.paths', 'AudioEvent', 'Media',
        function ($scope, $location, $resource, $routeParams, $url, paths, AudioEvent, Media) {

            $scope.status = 'idle';

            $scope.filterSettings = getEmptyFilterSettings();

            loadFilter();

            $scope.setFilter = function setFilter() {
                $location.path('/library').search($url.toKeyValue($scope.filterSettings));
            };

            $scope.clearFilter = function clearFilter() {

                $scope.filterSettings = getEmptyFilterSettings();

                $scope.setFilter();
            };

            $scope.updateFilter = function updateFilter(filterSettings) {
                $scope.filterSettings = filterSettings;
                $scope.setFilter();
            };


            $scope.createFilterUrl = function createFilterUrl(paramObj) {
                return '/library/?' + $url.toKeyValue(paramObj);
            };

            function getEmptyFilterSettings(){
                return {
                    tagsPartial: null,
                    reference: '', // set to empty string to match value of radio button
                    annotationDuration: null,
                    freqMin: null,
                    freqMax: null,
                    page: null,
                    items: null
                };
            }

            function loadFilter() {
                $scope.status = 'loading';
                $scope.filterSettings = angular.extend({}, $scope.filterSettings, $routeParams);

                // ensure properties that need to be numeric are actually numbers
                [
                    'annotationDuration',
                    'freqMin',
                    'freqMax',
                    'page',
                    'items'
                ].forEach(
                    function (currentvalue, index, array) {
                        var stringValue = $scope.filterSettings[currentvalue];
                        $scope.filterSettings[currentvalue] = stringValue === null ? null : Number(stringValue);
                    }
                );

                $scope.library = AudioEvent.library($scope.filterSettings, null, function librarySuccess(value, responseHeaders) {
                    value.entries.map(Media.getMediaItem);
                    value.audioElement = null;
                    $scope.paging = getPagingSettings($scope.library.page, $scope.library.items, $scope.library.total);
                    $scope.status = 'loaded';
                    $scope.responseDetails = responseHeaders;
                }, function libraryError(httpResponse){
                    $scope.status = 'error';
                    console.error('Failed to load library response.', $scope.filterSettings, httpResponse);
                });
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
        }])
    .controller('AnnotationItemCtrl', ['$scope', '$location', '$resource', '$routeParams', '$url', 'conf.paths', 'AudioEvent', 'Media',
        function ($scope, $location, $resource, $routeParams, $url, paths, AudioEvent, Media) {

            var parameters = {
                audioEventId: $routeParams.audioEventId,
                recordingId: $routeParams.recordingId
            };

            $scope.model = AudioEvent.get(parameters,
                function annotationShowSuccess(value, responseHeaders) {
                    Media.getMediaItem(value);
                    value.audioElement = null;
                    $scope.model = value;

                    if ($scope.model.paging.nextEvent.hasOwnProperty('audioEventId')) {
                        $scope.model.paging.nextEvent.link = '/library/' +
                            $scope.model.paging.nextEvent.audioRecordingId +
                            '/audio_events/' + $scope.model.paging.nextEvent.audioEventId;
                    }

                    if ($scope.model.paging.prevEvent.hasOwnProperty('audioEventId')) {
                        $scope.model.paging.prevEvent.link = '/library/' +
                            $scope.model.paging.prevEvent.audioRecordingId +
                            '/audio_events/' + $scope.model.paging.prevEvent.audioEventId;
                    }

                    $scope.model.audioEventDuration = Math.round10(value.endTimeSeconds - value.startTimeSeconds, -3);

                }, function annotationShowError(httpResponse) {
                    console.error('Failed to load library single item response.', parameters, httpResponse);
                });

            $scope.createFilterUrl = function createFilterUrl(paramObj) {
                return '/library/?' + $url.toKeyValue(paramObj);
            };

        }]);