angular.module("bawApp.demo.d3", [])
.controller(
    "D3TestPageCtrl",
    ["$scope", "conf.paths", "$http", "$routeParams", "$location", "$q",
        "Site", "Project", "AudioRecording",
        function ($scope, paths, $http, $routeParams, $location, $q,
                  Site, Project, AudioRecording) {

            // use the REST API in here
            // assign the resulting data to scope (not great but it will do for now)

            // get the site id (from route params or a default)
            $scope.siteId = $routeParams.siteId;
            $scope.projectId = $routeParams.projectId;
            if (!$scope.siteId && !$scope.projectId) {
                $scope.siteId = 398;
            }
            if ($scope.siteId && $scope.projectId) {
                throw new Error("A filtering project and site should not be both set");
            }

            // when the combo box changes, refresh the view
            $scope.selectedSiteChange = function () {
                if ($scope.currentSiteInfo) {
                    $location.search({siteId: $scope.currentSiteInfo.id, projectId: undefined});
                }
            };
            $scope.selectedProjectChange = function () {
                if ($scope.currentProjectInfo) {
                    $location.search({siteId: undefined, projectId: $scope.currentProjectInfo.id});
                }
            };


            // populate selects with options
            $q
                .all([Site.getAllSite(), Project.getAllProjectNames()])
                .then(
                function (results) {
                    $scope.sites = results[0].data.data;
                    $scope.projects = results[1].data.data;
                    console.log("Select population success", arguments);
                },
                function (error) {
                    console.log("error", arguments);
                }
            );

            $scope.current = function () {
                var key, groupKey;
                if ($scope.projectId) {
                    key = "projectId";
                    groupKey = "projects";
                }
                else {
                    key = "siteId";
                    groupKey = "sites";
                }

                if ($scope[groupKey]) {
                    var currentSelection = $scope[groupKey].reduce(function (prev, curr) {
                        if (curr.id === $scope[key]) {
                            prev.push(curr);
                        }

                        return prev;
                    }, [])[0];

                    return currentSelection.name;
                }
                else {
                    return $scope[key];
                }

            };

            // directive options
            $scope.calendarViewOptions = {
                singleColor: false
            };

            //  get the selected site details
            (function () {
                if ($scope.projectId) {
                    return Site.getSitesByProjectIds([$scope.projectId]);
                }
                else {
                    return Site.getSitesByIds([$scope.siteId]);
                }
            })().then(
                function getSiteSuccess(response) {
                    var sites = response.data.data;

                    sites.forEach(function (value) {
                        value.links = value.projectIds.map(function (id) {
                            return paths.api.routes.site.nestedAbsolute.format({
                                "siteId": value.id,
                                "projectId": id
                            });
                        });
                    });

                    $scope.downloadedSites = sites;
                    return sites.map(function (value) {
                        return value.id;
                    });
                }, function getSiteError() {
                    console.error("Retrieval of sites json failed");
                }
            ).then(AudioRecording.getRecordingsForVisualization)
                // get audio recording info for the current site
                .then(
                function (response) {
                    var data = response.data.data;
                    $scope.filteredAudioRecordings = data;
                },
                function (response) {
                    $scope.filteredAudioRecordings = [];
                    console.error("Filtered audio recordings failed.", response);
                });
        }
    ])
;
