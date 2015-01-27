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

            // object reference!
            this.options = $scope.options || {};

            this.options.functions = angular.extend(defaultFunctions, this.options.functions || {});
            this.options.functions.extentUpdate = function (newExtent) {
                function update() {
                    // object reference!
                    that.options.overviewExtent = newExtent;
                }

                that.detail.updateExtent(newExtent);

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
                }
            });

            function tryUpdateDataVariables(data, newValue, functions) {
                // public field - share the reference
                if (!newValue) {
                    data.items = [];
                    data.lanes = [];
                    data.maximum = null;
                    data.minimum = null;
                    return false;
                }
                else {
                    data.items = newValue || [];
                    data.lanes = d3.set(data.items.map(functions.getCategory)).values();
                    data.maximum = Math.max.apply(null, data.items.map(functions.getHigh, functions));
                    data.minimum = Math.min.apply(null, data.items.map(functions.getLow, functions));
                    return true;
                }
            }


        }
    ])
    .directive(
    "eventDistribution",
    function() {
        return {
            scope: {
                data: "=",
                options: "="
            },
            controller: "distributionController"
        };
    }
);