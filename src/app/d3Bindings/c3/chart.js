
angular.module("bawApp.d3.c3.donut", ["bawApp.vendorServices.auto"])
    .directive("c3Chart",
        ["d3", "c3", "moment", function (d3, c3, moment) {

            return {
                restrict: "E",
                scope: {
                    data: "<",
                    width: "<",
                    height: "<",
                    options: "<",
                    oninit: "<"
                },
                link: function ($scope, $element, attributes) {
                    var element = $element[0];

                    var chartElement = d3.select(element);

                    let defaultOptions = {
                        bindto: chartElement,
                        size: {
                            width: $scope.width,
                            height: $scope.height
                        },

                        oninit: $scope.oninit
                    };

                    let getSize = () => ({height: $scope.height, width: $scope.width});
                    let getOptions = () => Object.assign({}, defaultOptions, $scope.options,  {size: getSize()});


                    var chart;

                    // WARNING: expensive watch!
                    $scope.$watch(() => $scope.data, updateData, true);
                    // WARNING: expensive watch!
                    $scope.$watch(() => $scope.options, updateOptions, true);
                    $scope.$watch(() => $scope.width, updateSize);
                    $scope.$watch(() => $scope.height, updateSize);

                    function initChart() {
                        if (!$scope.data || (!$scope.data.columns && !$scope.data.rows)) {
                            return;
                        }

                        let mergedOptions = getOptions();
                        mergedOptions.size = getSize();
                        mergedOptions.data = $scope.data;

                        chart = c3.generate(mergedOptions);
                    }

                    function updateData(newValue) {
                        if (chart) {

                            let options = {
                                unload: true
                            };
                            Object.assign(options, newValue);
                            chart.load(options);
                        }
                        else {
                            initChart();
                        }
                    }

                    function updateOptions() {
                        if (chart) {
                            chart = chart.destroy();
                        }

                        initChart();
                    }

                    function updateSize() {
                        if (chart) {
                            chart.resize(getSize());
                        }
                    }


                }

            };
        }]
    );