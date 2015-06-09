angular
    .module("bawApp.d3.eventDistribution.distributionController", [])
    .controller(
    "distributionController",
    [
        "$scope",
        "$element",
        "$attrs",
        "d3",
        "moment",
        function distributionController($scope, $element, $attrs, d3, moment) {
            console.debug("event distribution controller:init");
            var self = this,
                defaultFunctions = {
                    getId: function (d) {
                        return d.id;
                    },
                    getCategory: function (d) {
                        return d.lane;
                    },
                    getLow: function (d) {
                        return d.min;
                    },
                    getHigh: function (d) {
                        return d.max;
                    },
                    getText: function (d) {
                        return d.text;
                    },
                    getTileUrl: function(date, category, tileSizeSeconds, tileSizePixels, datum) {
                        var hourOfDay = date.getHours();
                        return "/tile_" + hourOfDay + ".png";
                    }
                };


            self.data = {};
            //this.visualisationData = {
            //    items: [],
            //    nyquistFreuency: 11025,
            //    spectrogramWindowSize: 512,
            //    middle: new Date()
            //};

            // object reference!
            self.options = $scope.options = angular.extend({
                nyquistFrequency: 11025,
                spectrogramWindowSize: 512
            }, $scope.options);

            $scope.options.functions = angular.extend(defaultFunctions, $scope.options.functions || {});

            function tryUpdateExtent(name, data) {
                if (self[name]) {
                    self[name].updateExtent(data);
                }
            }

            self.currentExtent = null;
            $scope.options.functions.extentUpdate = function (newExtent, source) {
                self.currentExtent = newExtent;
                var difference = newExtent[1] - newExtent[0];
                var humanDuration = difference === 0 ? "" : moment.duration(difference).humanize();
                var selectedLane = self.detail.selectedCategory || self.data.lanes[0] || "";

                if (source != "DistributionOverview") {
                    tryUpdateExtent("overview", newExtent);
                }
                if (source != "DistributionDetail") {
                    self.detail.updateExtent(newExtent);
                }
                if (source != "DistributionVisualisation") {
                    self.visualisation.updateMiddle(middlePointBetweenDates(newExtent), selectedLane);
                    var visualizationMiddle = self.visualisation.visibleDuration;
                    var humanized = visualizationMiddle && moment.duration(visualizationMiddle, "seconds").humanize() || "";
                }

                function update() {
                    // object reference!
                    $scope.options.overviewExtent = newExtent;
                    $scope.options.detailDuration = humanDuration;
                    $scope.options.detailExtent = newExtent;
                    $scope.options.visualizationDuration = humanized;
                    $scope.options.selectedLane = selectedLane;
                }

                if (!$scope.$root.$$phase) {
                    $scope.$apply(update);
                }
                else {
                    $scope.$eval(update);
                }
            };

            $scope.options.functions.visualisationDurationUpdate = function(newDuration) {
                if (self.overview) {
                    self.overview.updateVisualisationDuration(newDuration);
                }

                if (self.detail) {
                    self.detail.updateVisualisationDuration(newDuration);
                }
            };


            this.detail = null;                //$scope.controls.detail        =
            this.overview = null;              //$scope.controls.overview      =
            this.visualisation = null;         //$scope.controls.visualisation =

            function tryUpdateData(name, data) {
                if (self[name]) {
                    self[name].updateData(data);
                }
            }

            // only watches changes to object reference
            $scope.$watch(function () {
                return $scope.data;
            }, function (newValue, oldValue) {
                if (tryUpdateDataVariables(self.data, newValue, $scope.options)) {
                    tryUpdateData("overview", self.data);
                    tryUpdateData("detail", self.data);
                    tryUpdateData("visualisation", self.data);

                    // new behaviour, set default extent to full width of data
                    if (self.data.items.length > 0) {
                        $scope.options.functions.extentUpdate([self.data.minimum, self.data.maximum]);
                    }
                }
            });

            function tryUpdateDataVariables(data, newValue, options) {
                var functions = options.functions;
                // public field - share the reference
                if (!newValue) {
                    data.items = [];
                    data.lanes = [];
                    data.maximum = null;
                    data.minimum = null;
                    data.nyquistFrequency = null;
                    data.spectrogramWindowSize = null;
                    return false;
                }
                else {
                    data.items = newValue || [];
                    data.lanes = d3.set(data.items.map(functions.getCategory)).values();
                    if (data.items.length > 0) {
                        data.maximum = Math.max.apply(null, data.items.map(functions.getHigh, functions));
                        data.minimum = Math.min.apply(null, data.items.map(functions.getLow, functions));
                    }
                    else {
                        data.maximum = 0;
                        data.minimum = 0;
                    }
                    data.nyquistFrequency = options.nyquistFrequency;
                    data.spectrogramWindowSize = options.spectrogramWindowSize;
                    return true;
                }
            }

            function middlePointBetweenDates(extent) {
                if (!extent || extent.length !== 2) {
                    return null;
                }

                var min = extent[0],
                    max = extent[1];

                // milliseconds
                var midDiff = (max - min) / 2.0;
                return (+min) + midDiff;
            }
        }
    ])
    .directive(
    "eventDistribution",
    function () {
        return {
            scope: {
                data: "=",
                options: "="
                //controls: "="
            },
            controller: "distributionController"
        };
    }
);