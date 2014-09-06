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
            $scope.recentRecordings = [
                {
                    siteId: 1000,
                    duration: 123456,
                    uploaded: new Date(),
                    id: 1234
                },
                {
                    siteId: 1000,
                    duration: 123456,
                    uploaded: new Date(),
                    id: 1234
                },
                {
                    siteId: 1000,
                    duration: 123456,
                    uploaded: new Date(),
                    id: 1234
                }
            ];

            function audioRecordingsFormat(wrapper) {
                $scope.recentRecordings = wrapper.data;
                // format return objects for display
                $scope.recentRecordings.forEach(function(value, index) {
                    value.durationHumanized = moment.duration(value.durationSeconds, "seconds").humanizeDuration();
                    value.uploadedHumanized = moment(value.createdAt).fromNow();
                    value.listenLink = paths.site.ngRoutes.listen.format({recordingId: value.id});
                });

                return Site.getSitesByIds();
            }

            function sitesFormat(wrapper) {
                var sites = wrapper.reduce(function(state, current) {
                    state[current.id] = current;
                    return state;
                }, {});

                $scope.audioRecordings.forEach(function (value) {
                   value.site = sites[value.siteId];
                });
            }

            AudioRecording
                .getRecentRecordings()
                .then(audioRecordingsFormat)
                .then(function gsbiSucccess(data) {

                })
                .catch(function error(reason) {
                    console.error(reason);
                });



            //Site.getNames();

            $scope.navigate = function navigate(link) {
                $location.url(link);
            };
        }
    ]
);