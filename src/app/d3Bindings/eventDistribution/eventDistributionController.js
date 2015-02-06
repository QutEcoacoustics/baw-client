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
            var that = this,
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
                    }
                };


            this.data = {};
            //this.visualisationData = {
            //    items: [],
            //    nyquistFreuency: 11025,
            //    spectrogramWindowSize: 512,
            //    middle: new Date()
            //};

            // object reference!
            this.options = $scope.options = angular.extend({
                nyquistFrequency: 11025,
                spectrogramWindowSize: 512
            }, $scope.options);

            $scope.options.functions = angular.extend(defaultFunctions, $scope.options.functions || {});
            $scope.options.functions.extentUpdate = function (newExtent) {
                var difference = newExtent[1] - newExtent[0];
                var humanDuration = difference === 0 ? "" : moment.duration(difference).humanize();

                that.detail.updateExtent(newExtent);

                // TODO: fix 2nd arg
                that.visualisation.updateMiddle(middlePointBetweenDates(newExtent),  "NE Site");
                var visualizationMiddle = that.visualisation.visibleDuration;
                var humanized = visualizationMiddle && moment.duration(visualizationMiddle, "seconds").humanize() || "";

                function update() {
                    // object reference!
                    $scope.options.overviewExtent = newExtent;
                    $scope.options.detailDuration = humanDuration;
                    $scope.options.visualizationDuration = humanized;
                }

                if (!$scope.$root.$$phase) {
                    $scope.$apply(update);
                }
                else {
                    $scope.$eval(update);
                }
            };


            this.detail = null;                //$scope.controls.detail        =
            this.overview = null;              //$scope.controls.overview      =
            this.visualisation = null;         //$scope.controls.visualisation =


            // only watches changes to object reference
            $scope.$watch(function () {
                return $scope.data;
            }, function (newValue, oldValue) {
                if (tryUpdateDataVariables(that.data, newValue, $scope.options)) {
                    that.overview.updateData(that.data);
                    that.detail.updateData(that.data);
                    that.visualisation.updateData(that.data);
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
                    data.maximum = Math.max.apply(null, data.items.map(functions.getHigh, functions));
                    data.minimum = Math.min.apply(null, data.items.map(functions.getLow, functions));
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