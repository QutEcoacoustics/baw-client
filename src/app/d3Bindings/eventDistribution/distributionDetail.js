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
            return function DistributionDetail(target, data, dataFunctions, uniqueId) {
                var that = this,
                    container = d3.select(target),
                    chart,
                    main,
                    mainClip,
                    xAxis,
                    xScale,
                    yScale,
                    laneLinesGroup,
                    laneLabelsGroup,
                    mainItemsGroup,
                    laneLabelMarginRight = 5,
                    xAxisHeight = 30,
                    margin = {
                        top: 5,
                        right: 20,
                        bottom: 5 + xAxisHeight,
                        left: 120
                    },
                // these are initial values only
                // this is the width and height of the main group
                    mainWidth = 1000,
                    mainHeight = 256,
                    laneHeight = 120,
                    lanePaddingDomain = 0.125;

                // exports
                this.updateData = updateData;
                this.updateExtent = updateExtent;
                this.items = [];
                this.lanes = [];
                this.minimum = null;
                this.maximum = null;
                this.visibleExtent = null;

                // init
                create();

                // exported functions

                function updateData(data) {
                    updateDataVariables(data);

                    updateDimensions();

                    updateScales();

                    updateMain();
                }

                function updateExtent(extent) {
                    that.visibleExtent = extent;

                    updateScales();

                    extentUpdateMain();



                }

                // other functions
                function create() {


                    createChart();
                    chart
                        .attr("height", 0)
                        .append("defs")
                        .append("clipPath")
                        .attr("id", "clip")
                        .append("rect")
                        .attr({
                                  width: 500,
                                  height: 200
                              });

                    updateDimensions();

                    createMain();



                }

                function createChart() {
                    chart = container.append("svg")
                        .classed("chart", true)
                        .attr("width", mainWidth)
                        .attr("height", mainHeight);


                }

                function updateDimensions() {
                    mainWidth = calculateMainWidth();
                    mainHeight = Math.max(getLaneLength() * laneHeight, laneHeight);


                    //mainClip.attr({
                    //    width: mainWidth,
                    //    height: mainHeight
                    //});

                    chart.style("height", svgHeight() + "px");
                }

                function createMain() {
                    // create main surface
                    main = chart.append("g")
                        .attr("width", mainWidth)
                        .attr("height", mainHeight)
                        .classed("main", true)
                        .translate([margin.left, margin.top]);

                    // group for separator lines between lanes/categories
                    laneLinesGroup = main.append("g").classed("laneLinesGroup", true);

                    // group for textual labels, left of the lanes
                    laneLabelsGroup = main.append("g").classed("laneLabelsGroup", true);

                    // group for rects painted in lanes
                    mainItemsGroup = main.append("g")
                        .attr("clip-path", "url(#clip)")
                        .classed("mainItemsGroup", true);

                    xAxis = new TimeAxis(main, xScale, {position: [0, mainHeight]})
                }

                function updateDataVariables(data) {
                    // public field - share the reference
                    that.items = data.items || [];
                    that.lanes = data.lanes || [];
                    that.maximum = data.maximum;
                    that.minimum = data.minimum;
                }

                function updateScales() {
                    xScale = d3.time.scale()
                        .domain(that.visibleExtent || [that.minimum, that.maximum])
                        .range([0, mainWidth]);

                    yScale = d3.scale.linear()
                        .domain([0, getLaneLength()])
                        .range([0, mainHeight]);
                }


                function updateMain() {

                    // separator lines between categories
                    function getSeparatorLineY(d, i) {
                        return yScale(i);
                    }

                    laneLinesGroup.selectAll()
                        .data(that.lanes)
                        .enter()
                        .append("line")
                        .attr({
                            x1: 0,
                            y1: getSeparatorLineY,
                            x2: mainWidth,
                            y2: getSeparatorLineY,
                            class: "laneLines"
                        });

                    // lane labels
                    laneLabelsGroup.selectAll()
                        .data(that.lanes)
                        .enter()
                        .append("text")
                        .text(id)
                        .attr({
                            x: -laneLabelMarginRight,
                            y: function (d, i) {
                                // 0.5 shifts it halfway into lane
                                return yScale(i + 0.5);
                            },
                            dy: ".5ex",
                            "text-anchor": "end",
                            class: "laneText"
                        });

                    extentUpdateMain();
                }

                /**
                 * Called when the extent is updated to repaint rects
                 */
                function extentUpdateMain() {

                    // filter out data that is not in range
                    var visibleItems = that.items.filter(isRectVisible);

                    // paint the visible rects
                    var rectAttrsUpdate = {
                            x: function (d) {
                                return xScale(dataFunctions.getLow(d));
                            },
                            width: function (d) {
                                return xScale(dataFunctions.getHigh(d)) - xScale(dataFunctions.getLow(d));
                            }
                        },
                        rectAttrs = {
                            "class": function (d) {
                                return "miniItem" + getCategoryIndex(d);
                            },
                            x: rectAttrsUpdate.x,
                            y: function (d) {
                                return yScale(getCategoryIndex(d) + lanePaddingDomain);
                            },
                            width: rectAttrsUpdate.width,
                            height: yScale(1.0 - (2 * lanePaddingDomain))
                        };

                    // update the visible rects
                    var rects = mainItemsGroup.selectAll("rect")
                        .data(visibleItems, function getKey(d) {
                            return dataFunctions.getId(d);
                        })
                        .attr(rectAttrsUpdate);

                    // add new rects
                    rects.enter()
                        .append("rect")
                        .attr(rectAttrs);

                    // remove old rects
                    rects.exit().remove();


                    // finally update the axis
                    if (data && data.items.length > 0) {
                        var domain = xScale.domain(),
                        // intentionally falsey
                            showAxis = domain[1] - domain[0] != 0;

                        xAxis.update(xScale, [0, mainHeight], showAxis);
                    }

                }

                function isRectVisible(d) {
                    return dataFunctions.getLow(d) < that.visibleExtent[1]
                        && dataFunctions.getHigh(d) > that.visibleExtent[0];
                }

                function getCategoryIndex(d) {
                    return that.lanes.indexOf(dataFunctions.getCategory(d));
                }

                function getLaneLength() {
                    return that.lanes && that.lanes.length || 0;
                }

                function calculateMainWidth() {
                    return chart.node().getBoundingClientRect().width - margin.left - margin.right;
                }

                function svgHeight() {
                    return mainHeight + margin.top + margin.bottom;
                }

                function id(a) {
                    return a;
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
                scope: false,
                require: "^^eventDistribution",
                controller: "distributionController",
                link: function ($scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];
                    controller.detail = new DistributionDetail(
                        element,
                        controller.data,
                        controller.options.functions,
                        $scope.$id);
                }
            };
        }
    ]
);