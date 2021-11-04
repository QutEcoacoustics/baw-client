angular
    .module("bawApp.annotationLibrary.library", [])
    .controller(
    "AnnotationLibraryCtrl",
    [
        "$scope",
        "$location",
        "$resource",
        "$routeParams",
        "$q",
        "lodash",
        "$url",
        "conf.paths",
        "conf.constants",
        "bawApp.unitConverter",
        "annotationLibraryCommon",
        "UserProfile",
        "AudioEvent",
        "baw.models.AudioEvent",
        "Tag",
        "Media",
        "baw.models.Media",
        function ($scope, $location, $resource, $routeParams, $q,
                  _, $url,
                  paths, constants, unitConverter, libraryCommon,
                  UserProfile, AudioEventService, AudioEvent, Tag, MediaService, Media) {

            $scope.status = "idle";
            $scope.dateFormat = constants.localization.dateTimeFormatAngular;
            $scope.sortableFields = [
                {
                    text: "Date created",
                    id: "createdAt"
                },
                {
                    text: "Duration",
                    id: "durationSeconds"
                },
                {
                    text: "Low Frequency",
                    id: "lowFrequencyHertz"
                },
                {
                    text: "High Frequency",
                    id: "highFrequencyHertz"
                }
            ];
            $scope.hideSearch = false;
            $scope.filterSettings = getEmptyFilterSettings();
            $scope.paging = getPagingSettings(0, 0, 0);
            $scope.getPaginationLink = getPagingLink;
            $scope.currentUser = undefined;

            UserProfile.get.then(() => {
                $scope.currentUser = UserProfile.profile.id;
            });

            loadFilter();

            function loadFilter() {
                $scope.status = "loading";

                // pull settings from query string, if present
                normaliseFilterSettings();

                AudioEventService
                    .getLibraryItems($scope.filterSettings)
                    .then(librarySuccess)
                    .then(function (data) {
                        return $q.all([
                            libraryCommon.getSiteMediaAndProject(data),
                            libraryCommon.getTags(data)
                        ]);
                    })
                    .catch(function libraryError(httpResponse) {
                        $scope.status = "error";
                        console.error("Failed to load library response.", $scope.filterSettings, httpResponse);
                    });
            }

            function librarySuccess(response, responseHeaders) {
                console.debug("annotationLibrary::librarySuccess");

                var paging = response.data.meta.paging;
                $scope.status = "loaded";
                $scope.paging = getPagingSettings(paging.page, paging.items, paging.total);
                $scope.annotations = [];

                // collect audio ids so we can fetch tags
                // and recording ids for media, sites, projects, etc...
                var annotationIds = new Set(),
                    recordingIds = new Set();

                var audioEvents = AudioEvent.makeFromApi(response);

                audioEvents.data.data.forEach(function (audioEvent, index) {

                    annotationIds.add(audioEvent.id);
                    recordingIds.add(audioEvent.audioRecordingId);

                    libraryCommon.addCalculatedProperties(audioEvent);

                    // todo: add these from user preferences
                    audioEvent.audioElement = {
                        volume: 1,
                        muted: false,
                        autoPlay: false,
                        position: 0
                    };

                    $scope.annotations.push(audioEvent);
                });

                return {annotations: $scope.annotations, annotationIds, recordingIds};
            }

            // $scope functions

            $scope.createFilterUrl = libraryCommon.createFilterUrl;

            $scope.setFilter = function setFilter() {
                window.top.location.href = $scope.createFilterUrl($scope.filterSettings);
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

            // helper functions

            function getEmptyFilterSettings() {
                return {
                    tagsPartial: null,
                    reference: "reference",
                    userId: null,
                    audioRecordingId: null,
                    minDuration: null,
                    maxDuration: null,
                    lowFrequency: null,
                    highFrequency: null,
                    page: 1,
                    items: 10,
                    sortBy: undefined,
                    sortByType: undefined
                };
            }

            function normaliseFilterSettings() {
                $scope.filterSettings = Object.assign({}, $scope.filterSettings, $routeParams);


                // ensure properties that need to be numeric are actually numbers
                [
                    "minDuration",
                    "maxDuration",
                    "lowFrequency",
                    "highFrequency",
                    "page",
                    "items",
                    "userId",
                    "audioRecordingId"
                ].forEach(
                    function (currentvalue, index, array) {
                        var stringValue = $scope.filterSettings[currentvalue];
                        var isVoid = stringValue === null || stringValue === undefined || stringValue === "";
                        $scope.filterSettings[currentvalue] = isVoid ? null : Number(stringValue);
                    }
                );

                // reassign the paging
                $scope.paging.page = $scope.filterSettings.page;
                $scope.paging.items = $scope.filterSettings.items;
            }

            function getPagingLink(page) {
                //console.debug("pagination link:", page);
                return $scope.createFilterUrl(
                    Object.assign({}, $scope.filterSettings,
                        {page, items: $scope.paging.items})
                );
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

                return paging;
            }

            $scope.setSortBy = function setSortBy() {
                if ($scope.filterSettings.sortBy && !$scope.filterSettings.sortByType) {
                    $scope.filterSettings.sortByType = "asc";
                }
            };
        }]);