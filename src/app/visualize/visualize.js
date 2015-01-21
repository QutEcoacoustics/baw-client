angular
    .module("bawApp.visualize", [])
    .controller(
    "VisualizeController",
    [
        "$scope",
        "$http",
        function ($scope, $http) {

            // testing data
            $scope.recordingData = [];
            $http.get("assets/temp/dummyData.json").then(function (response) {
                $scope.recordingData = response.data;
            }, function () {
                console.error("loading dummy data failed", arguments);
            });

            $scope.distributionOptions = {
                functions: {
                    getId: function (d) {
                        return d.audioId;
                    },
                    getCategory: function (d) {
                        return d.siteName;
                    },
                    getLow: function (d) {
                        if ((typeof d.recordedDate) === "string") {
                            d.recordedDate = new Date(d.recordedDate);
                            d.minimumMilliseconds = d.recordedDate.getTime();
                        }
                        return d.minimumMilliseconds;
                    },
                    getHigh: function (d) {
                        if ((typeof d.durationSeconds) === "string") {
                            d.durationSeconds = Number(d.durationSeconds);
                            d.durationMilliseconds = d.durationSeconds * 1000;
                        }
                        return this.getLow(d) + d.durationMilliseconds;
                    },
                    getText: function (d) {
                        return d.audioId;
                    }
                }
            };


            // gridlines
            $scope.gridConfig = {

                y: {
                    showGrid: true,
                    showScale: true,
                    showTitle: true,
                    max: 11025,
                    min: 0,
                    step: 1000,
                    height: 256,
                    labelFormatter: function (value, index, min, max) {
                        return (value / 1000).toFixed(1);
                    },
                    title: "Frequency (KHz)"
                },
                x: {
                    showGrid: true,
                    showScale: true,
                    showTitle: true,
                    max: 24,
                    min: 0,
                    step: 1,
                    width: 1440,
                    labelFormatter: function (value, index, min, max) {
                        // show 'absolute' time.... i.e. seconds of the minute
                        var offset = (value % 60);

                        return (offset).toFixed(0);
                    },
                    title: "Time (hours)"
                }
            };
        }
    ]
);