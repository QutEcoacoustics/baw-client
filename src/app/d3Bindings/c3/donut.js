angular.module("bawApp.d3.c3.donut", ["bawApp.vendorServices.auto"])
    .directive("c3Donut",
        ["d3", "c3", "moment", function (d3, c3, moment) {

            return {
                restrict: "E",
                scope: {
                    data: "<"
                },
                link: function ($scope, $element, attributes) {
                    var element = $element[0];

                    var chart = d3.select(element);

                    c3.generate({
                        bindto: chart,
                        data: {
                            columns: [
                                ["data1", 30],
                                ["data2", 120],
                            ],
                            type: "donut",
                        },
                        donut: {
                            title: "Iris Petal Width"
                        },
                        size: {
                            width: 500,
                            height: 320
                        }
                    });
                }

            };
        }]
    );