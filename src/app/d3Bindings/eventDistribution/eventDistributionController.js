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
            "roundDate",
            "rbush",
            function distributionController($scope, $element, $attrs, d3, moment, roundDate, rbush) {
                console.debug("event distribution controller:init");
                var self = this,
                    defaultFunctions = {
                        getId: function (d) {
                            return d.id;
                        },
                        getCategory: function (category) {
                            return category;
                        },
                        getCategoryName: function (d) {
                            return d;
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
                        getTileUrl: function (date, tileSizePixels, datum) {
                            var hourOfDay = date.getHours();
                            return "/tile_" + hourOfDay + ".png";
                        }
                    };

                self.data = {};

                // object reference!
                let defaults = Object.assign({
                    initialSelection: null,
                    visualizationYMax: 1000,
                    visualizationTileHeight: 100
                }, $scope.options);
                self.options = Object.assign($scope.options, defaults);

                let mergedFunctions = Object.assign(defaultFunctions, $scope.options.functions);
                Object.assign($scope.options.functions, mergedFunctions);

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

                    if (source !== "DistributionOverview") {
                        tryUpdateExtent("overview", newExtent);
                    }
                    if (source !== "DistributionDetail") {
                        self.detail.updateExtent(newExtent);
                    }
                    if (source !== "DistributionVisualisation") {
                        self.visualisation.forEach(x => {
                            x.updateMiddle(middlePointBetweenDates(newExtent), selectedLane, self.detail.currentZoomValue);
                        });
                        var visualizationMiddles = self.visualisation.map(x => x.visibleDuration);
                        var humanized = visualizationMiddles &&
                            visualizationMiddles.map(x => moment.duration(x, "seconds").humanize()) || "";
                    }

                    $scope.options.functions.extentUpdated(newExtent, selectedLane);

                    function update() {
                        // object reference!
                        $scope.options.overviewExtent = newExtent;
                        $scope.options.detailDuration = humanDuration;
                        $scope.options.detailExtent = newExtent;
                        $scope.options.visualizationDuration = humanized;
                        $scope.options.selectedLane = selectedLane;
                        $scope.options.currentResolution = self.detail.resolution.toFixed(2);
                        $scope.options.currentZoom = self.detail.currentZoomValue.toFixed(0);
                    }

                    if (!$scope.$root.$$phase) {
                        $scope.$applyAsync(update);
                    }
                    else {
                        $scope.$evalAsync(update);
                    }
                };

                $scope.options.functions.visualisationDurationUpdate = function (newDuration) {
                    if (self.overview) {
                        self.overview.updateVisualisationDuration(newDuration);
                    }

                    if (self.detail) {
                        self.detail.updateVisualisationDuration(newDuration);
                    }
                };


                this.detail = null;                //$scope.controls.detail        =
                this.overview = null;              //$scope.controls.overview      =
                this.visualisation = [];         //$scope.controls.visualisation =

                function tryUpdateData(name, data) {
                    if (angular.isArray(self[name])) {
                        self[name].forEach(x => x.updateData(data));
                    }
                    else if (self[name]) {
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
                            let extent = [self.data.minimum, self.data.maximum],
                                category = null;

                            // additionally, support setting initial extent for deep linking scenarios
                            if ($scope.options.initialSelection) {

                                ({extent, category} = $scope.options.initialSelection); // jshint ignore:line

                                // only set initial extent once
                                $scope.options.initialSelection = null;
                            }

                            if (category) {
                                self.detail.selectedCategory = category;
                            }
                            $scope.options.functions.extentUpdate(extent);
                        }
                    }
                });

                const secondsInOneDay = 86400;

                function tryUpdateDataVariables(data, newValue, options) {
                    var functions = options.functions;
                    // public field - share the reference
                    if (!newValue) {
                        data.items = [];
                        data.lanes = [];
                        data.maximum = null;
                        data.minimum = null;
                        data.visualizationYMax = null;
                        data.visualizationTileHeight = null;
                        return false;
                    }
                    else {
                        data.items = newValue || [];
                        // a R*-Tree for fast item retrieval
                        data.itemsTree = rbush(9, functions.getBoundingBoxAccessors());
                        data.itemsTree.load(data.items);

                        let unique = new Set(data.items.map(functions.getCategory));
                        data.lanes = Array.from(unique);
                        if (data.items.length > 0) {
                            data.minimum = Math.min(...data.items.map(functions.getLow, functions));
                            data.maximum = Math.max(...data.items.map(functions.getHigh, functions));

                            // attempt to "nicefy" the dates for better rounding
                            data.minimum = roundDate.floor(secondsInOneDay, data.minimum);
                            data.maximum = roundDate.ceil(secondsInOneDay, data.maximum);
                        }
                        else {
                            data.minimum = 0;
                            data.maximum = 0;
                        }
                        $scope.options.dataMinimum = data.minimum;
                        $scope.options.dataMaximum = data.maximum;

                        data.visualizationYMax = options.visualizationYMax;
                        data.visualizationTileHeight = options.visualizationTileHeight;
                        data.availableResolutions = options.availableResolutions;

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
