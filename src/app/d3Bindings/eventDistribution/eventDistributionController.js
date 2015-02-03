angular
    .module("bawApp.d3.eventDistribution.distributionController", [])
    .controller(
    "distributionController",
    [
        "$scope",
        "$element",
        "$attrs",
        "d3",
        function distributionController($scope, $element, $attrs, d3) {
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
            this.options = angular.extend({
                nyquistFrequency: 11025,
                spectrogramWindowSize: 512
            }, $scope.options);

            this.options.functions = angular.extend(defaultFunctions, this.options.functions || {});
            this.options.functions.extentUpdate = function (newExtent) {
                function update() {
                    // object reference!
                    that.options.overviewExtent = newExtent;
                }

                that.detail.updateExtent(newExtent);

                // TODO: fix 2nd arg
                that.visualisation.updateMiddle(middlePointBetweenDates(newExtent),  "NE Site");

                if (!$scope.$root.$$phase) {
                    $scope.$apply(update);
                }
                else {
                    $scope.$eval(update);
                }
            };

            this.detail = null;
            this.overview = null;
            this.visualisation = null;


            // only watches changes to object reference
            $scope.$watch(function () {
                return $scope.data;
            }, function (newValue, oldValue) {
                if (tryUpdateDataVariables(that.data, newValue, that.options.functions)) {
                    that.overview.updateData(that.data);
                    that.detail.updateData(that.data);
                    that.visualisation.updateData(that.data);
                }
            });

            function tryUpdateDataVariables(data, newValue, functions) {
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
                    data.nyquistFrequency = that.options.nyquistFrequency;
                    data.spectrogramWindowSize = that.options.spectrogramWindowSize;
                    return true;
                }
            }

            function middlePointBetweenDates(extent) {
                if (!extent || extent.length !== 2) {
                    return null;
                }

                var min = extent[0],
                    max = extent[1];

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
            },
            controller: "distributionController"
        };
    }
);