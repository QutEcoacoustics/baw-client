/**
 * Created by Anthony.
 *
 * Intended to provide a detailed view of a distribution of
 * time-based events/records. Has zoom/filter controls that update a shared controller/scope
 * which the eventDistributionOverview directive renders.
 */
angular
    .module("bawApp.d3.eventDistribution.distributionDetail", [])
    .service(
    "DistributionDetail",
    [
        "d3",
        "TimeAxis",
        function (d3, TimeAxis) {
            return function DistributionDetail(target, data, dataFunctions) {
                var that = this,
                    container = d3.select(target),
                    chart,
                    main,
                    xAxis,
                    xScale,
                    yScale,
                    laneLinesGroup,
                    laneLabelsGroup,
                    mainItemsGroup,
                    margin = {
                        top: 5,
                        right: 20,
                        bottom: 5,
                        left: 120
                    },
                    // these are initial values only
                    // this is the width and height of the main group
                    mainWidth = 1000,
                    mainHeight = 256;

                // exports
                this.updateData = updateData;

                // init
                create();

                // exported functions

                function updateData() {

                }

                // other functions
                function create() {
                    createChart();

                    createMain();
                }

                function createChart() {
                    chart = container.append("svg")
                        .classed("chart", true);
                }

                function createMain() {
                    // create main surface
                    main = chart.append("g")
                        .translate([margin.left, margin.top]);

                    // group for separator lines between lanes/categories
                    laneLinesGroup = main.append("g").classed("laneLinesGroup", true);

                    // group for textual labels, left of the lanes
                    laneLabelsGroup = main.append("g").classed("laneLabelsGroup", true);

                    // group for rects painted in lanes
                    mainItemsGroup = main.append("g").classed("mainItemsGroup", true);

                    xAxis = new TimeAxis(main, xScale, {y: mainHeight})
                }
            }
        }
    ]
).directive(
    "eventDistributionDetail",
    [
        "DistributionDetail",
        function (DistributionDetail) {
            // directive definition object
            return {
                restrict: "EA",
                scope: {},
                require: "^^eventDistribution",
                link: function ($scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];

                    controller.detail = new DistributionDetail(element, {}, controller.dataFunctions);
                }
            };
        }
    ]
);