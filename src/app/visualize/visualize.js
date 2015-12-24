angular
    .module("bawApp.visualize", [])
    .controller(
        "VisualizeController",
        [
            "$scope",
            "$location",
            "$routeParams",
            "$http",
            "$q",
            "lodash",
            "moment",
            "$url",
            "conf.paths",
            "conf.constants",
            "baw.models.associations",
            "Project",
            "Site",
            "AudioRecording",
            "AnalysisResultFile",
            "UserProfile",
            function ($scope, $location, $routeParams, $http, $q, _, moment, $url,
                      paths, constants, modelAssociations,
                      Project, Site, AudioRecording, AnalysisResultFile, UserProfile) {
                const extent0Key = "extent0",
                    extent1Key = "extent1";

                var projectToSiteLinker = modelAssociations.generateLinker("Project", "Site");
                var siteToProjectLinker = modelAssociations.generateLinker("Site", "Project");

                var updateLocationSearch = _.throttle(function (newExtent) {
                    //console.debug(...newExtent);
                    $location.search({
                        [$scope.filterType]: $routeParams[$scope.filterType],
                        [extent0Key]: +newExtent[0],
                        [extent1Key]: +newExtent[1]
                    });
                }, 250);

                var sitesMap = {};
                var projectsMap = {};

                $scope.recordingData = [];
                $scope.errorState = undefined;
                $scope.hideImages = {hide: false};
                $scope.filterType = null;
                $scope.sites = [];
                $scope.projects = [];
                $scope.isLoading = true;

                // get user profile
                UserProfile.get.then(function () {
                    $scope.hideImages.hide = !!UserProfile.profile.preferences.visualize.hideImages;
                    console.debug("Visualize::User preference for hiding images set to ", $scope.hideImages.hide);
                });


                var parameters = validateParameters();

                // only start downloading if parameters are valid
                if (!parameters.error) {
                    var chain;
                    if (parameters.projectFirst) {
                        chain = Site.getSitesByProjectIds(parameters.ids);
                    }
                    else {
                        chain = Site.getSitesByIds(parameters.ids);
                    }

                    chain.then(sitesRetrieved)
                        .then(getOtherData)
                        .then(processOtherData, function error() {
                                $scope.isLoading = false;

                                if (!$scope.errorState) {
                                    $scope.errorState = "an unknown error occurred";
                                }
                                console.error("Visualise data promise chain failure", arguments);
                            }
                        );
                }

                // update user profile if needed
                $scope.$watch(function () {
                    return $scope.hideImages.hide;
                }, function (newValue) {
                    if (UserProfile.profile && newValue !== UserProfile.profile.preferences.visualize.hideImages) {

                        // delete old setting
                        delete UserProfile.profile.preferences.visualize.showTemporalContext;
                        UserProfile.profile.preferences.visualize.hideImages = newValue;

                        UserProfile.updatePreferences();
                    }
                });

                // options that bind the generic event distribution
                // controls to our particular data structures
                $scope.distributionOptions = {
                    functions: {
                        getId: function (d) {
                            return d.id;
                        },
                        getCategory: d => d.siteId,
                        getCategoryName: function (d) {
                            return d && sitesMap.get(d).name;
                        },
                        getLow: function (d) {
                            return d.recordedDateMilliseconds;
                        },
                        getHigh: function (d) {
                            return d.recordedEndDateMilliSeconds;
                        },
                        getText: function (d) {
                            return d.id;
                        },
                        /**
                         * Used by rbush (R*-Tree) for accessing object properties
                         * @returns {string[]}
                         */
                        getBoundingBoxAccessors() {
                            // format: [".minX", ".minY", ".maxX", ".maxY"]
                            return [".recordedDateMilliseconds", ".siteId", ".recordedEndDateMilliSeconds", ".siteId"];
                        },
                        getTileUrl: function (date, tileSizePixels, tileDatum) {
                            if ($scope.hideImages.hide) {
                                return;
                            }

                            var url = AnalysisResultFile.getLongDurationImageTile(
                                tileDatum.source,
                                date,
                                tileDatum.resolution,
                                null,
                                tileDatum.zoomStyleImage === true
                            );

                            // disabled for debugging
                            //url = undefined;

                            return url;
                        },
                        getNavigateUrl: function (date, tileSizePixels, itemDatum) {
                            var ar = itemDatum,
                                id = ar.id,
                            // convert delta to seconds, truncate milliseconds
                                startOffsetSeconds = Math.floor((date - ar.recordedDate) / 1000);

                            // do not allow negative indexing!
                            if (startOffsetSeconds < 0) {
                                startOffsetSeconds = 0;
                            }

                            // intentionally not specifying an end offset - let the listen page decide
                            return $url.formatUri(paths.site.ngRoutes.listen,
                                {
                                    recordingId: id,
                                    start: startOffsetSeconds
                                });
                        },
                        extentUpdated(newExtent) {
                            //console.debug(...newExtent);
                            // if value has changed, update the search for deep linkingness
                            if (newExtent) {
                                updateLocationSearch(newExtent);
                            }
                        }
                    },
                    // TODO: do not hard code
                    availableResolutions: [0.02, 0.04, 0.08, 0.16, 0.2, 0.4, 0.6, 1, 2, 4, 6, 12, 24, 60],
                    visualizationTileHeight: 256,
                    visualizationYMax: 11025,
                    initialExtent: parameters.initialExtent
                };

                $scope.getLegendClass = function (site) {
                    return "miniItem" + $scope.sites.indexOf(site);
                };

                $scope.resetZoomOnClick = function ($event) {
                    $scope.distributionOptions.functions.extentUpdate([
                        $scope.distributionOptions.dataMinimum,
                        $scope.distributionOptions.dataMaximum
                    ]);

                    //  unfocus
                    $event.toElement.blur();
                };

                function validateParameters() {

                    // parse QSPs
                    var hasProjectId = $routeParams.hasOwnProperty("projectId");
                    var hasSiteId = $routeParams.hasOwnProperty("siteId");
                    var hasSiteIds = $routeParams.hasOwnProperty("siteIds");

                    // only one QSP is valid
                    var qspsSet = _.countBy([hasProjectId, hasSiteId, hasSiteIds])["true"];
                    if (qspsSet !== 1) {
                        $scope.errorState = (qspsSet === undefined ? "No" : "Too many") + " query string options were specified";
                    }

                    // parse ids
                    var ids = [];
                    if (hasProjectId) {
                        ids.push(parseInt($routeParams.projectId, 10));
                        $scope.filterType = "projectId";
                    }
                    if (hasSiteId) {
                        ids.push(parseInt($routeParams.siteId, 10));
                        $scope.filterType = "siteId";
                    }
                    if (hasSiteIds) {
                        var siteIdString = $routeParams.siteIds;
                        $scope.filterType = "siteIds";

                        if (siteIdString) {
                            Array.prototype.push.apply(
                                ids,
                                siteIdString.split(",").map(function (x) {
                                    return parseInt(x, 10);
                                })
                            );
                        }
                    }

                    // validate ids
                    var validIds = ids.every(function (x) {
                        return typeof x === "number" &&
                            x >= 0 && !isNaN(x);
                    });

                    if (!validIds) {
                        $scope.errorState = "The site or project ids specified were invalid";
                    }

                    $scope.ids = ids;

                    var initialExtent = null;
                    if ($routeParams.hasOwnProperty(extent0Key) &&
                        $routeParams.hasOwnProperty(extent1Key)) {
                        initialExtent = [
                            new Date(Number($routeParams[extent0Key])),
                            new Date(Number($routeParams[extent1Key]))
                        ];
                    }

                    return {
                        error: $scope.errorState,
                        ids,
                        initialExtent,
                        projectFirst: hasProjectId
                    };
                }

                function sitesRetrieved(result) {
                    var sites = result.data.data;

                    if (!sites || sites.length === 0) {
                        $scope.errorState = "No sites could be found";
                        return $q.reject(new Error("Empty sites returned"));
                    }

                    sitesMap = modelAssociations.arrayToMap(sites);

                    $scope.sites = sites;

                    return sites;
                }

                function getOtherData(sites) {
                    var siteIds = [], projectIds = [];
                    sites.forEach(function (s) {
                        siteIds.push(s.id);
                        Array.prototype.push.apply(projectIds, s.projectIds);
                    });

                    return $q.all([
                        AudioRecording.getRecordingsForVisualization(siteIds),
                        Project.getByIds(projectIds)
                    ]);
                }

                function processOtherData(results) {
                    console.debug("Visualise data promise chain success", arguments);

                    $scope.isLoading = false;

                    var projects = results[1].data.data;
                    $scope.projects = projects;

                    projectsMap = modelAssociations.arrayToMap(projects);

                    projects.forEach(project => {
                        projectToSiteLinker(project, {
                            Site: sitesMap
                        });
                    });

                    sitesMap.forEach(site => {
                        siteToProjectLinker(site, {
                            Project: projectsMap
                        });
                    });

                    var audioRecordings = results[0].data.data;
                    $scope.recordingData = audioRecordings;
                }

            }
        ]
    );
