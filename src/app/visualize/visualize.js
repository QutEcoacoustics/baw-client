angular
    .module("bawApp.visualize", [])
    .controller(
    "VisualizeController",
    [
        "$scope",
        "$routeParams",
        "$http",
        "$q",
        "lodash",
        "moment",
        "conf.paths",
        "conf.constants",
        "Project",
        "Site",
        "AudioRecording",
        "UserProfile",
        function ($scope, $routeParams, $http, $q, _, moment, paths, constants, Project, Site, AudioRecording, UserProfile) {

            var sitesMap = {};

            $scope.recordingData = [];
            $scope.errorState = undefined;
            $scope.showOverview = false;
            $scope.filterType = null;
            $scope.sites = [];
            $scope.projects = [];
            $scope.isLoading = true;

            // get user profile
            UserProfile.get.then(function() {
                $scope.showOverview = UserProfile.profile.preferences.visualize.showTemporalContext;
                console.debug("Visualize::User preference for showing overview set to ", $scope.showOverview);
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
            $scope.$watch(function() {
                return $scope.showOverview;
            }, function (newValue) {
               if (UserProfile.profile && newValue != UserProfile.profile.preferences.visualize.showTemporalContext) {
                   UserProfile.profile.preferences.visualize.showTemporalContext = newValue;

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
                    getCategory: function (d) {
                        return sitesMap[d.siteId].name;
                    },
                    getLow: function (d) {
                        if ((typeof d.recordedDate) === "string") {
                            d.recordedDate = new Date(d.recordedDate);
                        }

                        if (d.minimumMilliseconds === undefined) {
                            d.minimumMilliseconds = d.recordedDate.getTime();
                        }

                        return d.minimumMilliseconds;
                    },
                    getHigh: function (d) {
                        if ((typeof d.durationSeconds) === "string") {
                            d.durationSeconds = Number(d.durationSeconds);
                        }

                        if (d.durationMilliseconds === undefined) {
                            d.durationMilliseconds = d.durationSeconds * 1000;
                        }
                        return this.getLow(d) + d.durationMilliseconds;
                    },
                    getText: function (d) {
                        return d.id;
                    },
                    getTileUrl: function(date, category, tileSizeSeconds, tileSizePixels, datum, index) {
                        var hourOfDay = date.getHours();

                        if (datum.source.id !== 188238) {
                            return;
                        }

                        // do not attempt to load dll's for demo
                        var url = paths.site.root + "/assets/temp/demo/188238_" + hourOfDay + ".png";
                        return url;
                    }
                }
            };

            $scope.getProjectLink = function(project) {
                if (project) {
                    return paths.api.routes.project.showAbsolute.format({projectId: project.id});
                }
            };

            $scope.getSiteLink = function(project, site) {
                if (project && site) {
                    return paths.api.routes.site.nestedAbsolute.format({siteId: site.id, projectId: project.id});
                }
            };

            $scope.getSitesForProject = function(project) {
                return $scope.sites.filter(function(site) {
                   return site.projectIds.indexOf(project.id) >= 0;
                });
            };

            $scope.formatDate = function(d) {
                return moment(d).format(constants.localization.dateTimeShortFormat);
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

                return {
                    projectFirst: hasProjectId,
                    ids: ids,
                    error: $scope.errorState
                }
            }

            function sitesRetrieved(result) {
                var sites = result.data.data;

                if (!sites || sites.length === 0) {
                    $scope.errorState = "No sites could be found";
                    return $q.reject(new Error("Empty sites returned"));
                }

                sitesMap = sites.reduce(function (previous, current) {
                    previous[current.id] = current;
                    return previous;
                }, {});

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
                ])
            }

            function processOtherData(results) {
                console.debug("Visualise data promise chain success", arguments);

                $scope.isLoading = false;

                var projects = results[1].data.data;
                $scope.projects = projects;

                var audioRecordings = results[0].data.data;
                $scope.recordingData = audioRecordings;


            }

        }
    ]
);