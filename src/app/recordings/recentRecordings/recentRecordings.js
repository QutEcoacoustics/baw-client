angular.module("bawApp.recordings.recentRecordings", [])
.controller("RecentRecordingsCtrl",
    [
        "$scope",
        "$location",
        "AudioRecording",
        "Site",
        "moment",
        "conf.paths",
        function RecentRecordingsCtrl($scope, $location, AudioRecording, Site, moment, paths) {
            $scope.recentRecordings = [null];

            function audioRecordingsFormat(response) {
                $scope.recentRecordings = response.data.data;

                // format return objects for display
                var siteIds = [];
                $scope.recentRecordings.forEach(function(value, index) {
                    value.durationHumanized = moment
                        .duration(Number(value.durationSeconds), "seconds")
                        .humanizeDuration({round: 3});
                    value.uploadedHumanized = moment(value.createdAt).fromNow();
                    value.listenLink = paths.site.ngRoutes.listenAbsolute.format({recordingId: value.id});
                    siteIds.push(value.siteId);
                });

                return Site.getSitesByIds(siteIds);
            }

            function sitesFormat(response) {
                if (!response) {
                    console.warn("bawApp.recordings.recentRecordings.sitesFormat:: empty response for get sites, skipping site format");
                    return;
                }

                var sites = response.data.data.reduce(function(state, current) {
                    state[current.id] = current;
                    return state;
                }, {});

                $scope.recentRecordings.forEach(function (value) {
                    value.site = sites[value.siteId];
                    value.site.siteLink = paths.api.links.siteAbsolute.format({projectId: value.site.projectIds[0], siteId: value.site.id});
                });
            }

            AudioRecording
                .getRecentRecordings()
                .then(audioRecordingsFormat)
                .then(sitesFormat)
                .catch(function error(reason) {
                    $scope.recentRecordings = [];
                    console.error(reason);
                });

            $scope.navigate = function navigate($event, link) {
                if ($event.target.nodeName.toLowerCase() === "a") {
                    return;
                }

                window.top.location.href = link;
            };
        }
    ]
);