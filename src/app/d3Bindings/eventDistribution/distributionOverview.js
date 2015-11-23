/**
 * Created by Anthony.
 *
 * Intended to provide a high level overview of a distribution of
 * time-based events/records. Has zoom/filter controls that update a shared controller/scope
 * which the eventDistributionDetail directive renders.
 */
angular
    .module("bawApp.d3.eventDistribution.distributionOverview", [])
    .service(
    "DistributionOverview",
    [
        "d3",
        "TimeAxis",
        function (d3, TimeAxis) {
            return function DistributionOverview(target, data, dataFunctions, uniqueId) {
                var that = this,
                    chart,
                    mini,
                    clipId = "distributionOverview_" + uniqueId,
                    miniClipRect,
                    xAxis,
                    xScale,
                    yScale,
                // this default value will be overwritten almost immediately
                    miniWidth = 1000,
                // this default value will be overwritten almost immediately
                    miniHeight = 200,
                    xAxisHeight = 17,
                    margin = {
                        top: 5,
                        right: 20,
                        bottom: 5 + xAxisHeight,
                        left: 120
                    },
                    laneHeight = 18,
                    lanePaddingDomain = 0.1,
                    labelRectPadding = 5,
                    container = d3.select(target),
                    _lockManualBrush = false,
                    visualisationDuration = null;

                // exports
                that.updateData = updateData;
                that.updateExtent = updateExtent;
                that.updateVisualisationDuration = function(newDuration) {
                    // update internal value for tracking
                    // but this is basically a noop
                    visualisationDuration = newDuration;
                };
                that.display = display;
                that.getLaneLength = getLaneLength;
                that.brush = null;
                that.items = null;
                that.lanes = null;
                that.maximum = null;
                that.minimum = null;
                that.selectedExtent = null;

                // init
                create();

                // public functions

                function create() {
                    updateDataVariables(data);

                    chart = createChart();

                    updateDimensions();

                    mini = createMini(chart);
                    xAxis = new TimeAxis(mini, xScale, {position: [0, miniHeight], isVisible: false});
                }

                function updateData(data, extent) {
                    updateDataVariables(data);

                    updateDimensions();

                    updateScales();

                    updateMini(mini);

                    if (data && data.items.length > 0) {
                        if (extent) {
                            updateExtent(extent);
                        }
                        else {
                            _lockManualBrush = true;
                            display();
                            _lockManualBrush = false;
                        }

                        xAxis.update(xScale, [0, miniHeight], true);
                    }
                }

                function updateExtent(extent) {
                    if (extent.length !== 2) {
                        throw new Error("Can't handle this many dimensions");
                    }

                    if (that.selectedExtent) {
                        if (extent[0] === that.selectedExtent[0] && extent[1] === that.selectedExtent[1]) {
                            console.debug("DistributionOverview:updateExtent: update skipped");
                            return;
                        }
                    }

                    that.selectedExtent = extent;
                    that.brush.extent(that.selectedExtent);
                    brushUpdate();
                }

                function getLaneLength() {
                    return that.lanes && that.lanes.length || 0;
                }

                // private functions

                function createChart() {
                    var chart = container
                        .append("svg")
                        .classed("chart", true);

                    miniClipRect = chart.append("defs")
                        .append("clipPath")
                        .attr("id", clipId)
                        .append("rect")
                        .attr({
                            width: miniWidth,
                            height: miniHeight
                        });

                    return chart;
                }

                /**
                 * Updates the dimensions of the svg container.
                 * The height scales with lanes.
                 * However, the width of the SVG is taken from the svg element,
                 * and internal widths are updated to match.
                 */
                function updateDimensions() {
                    miniWidth = calculateMiniWidth();
                    miniHeight = Math.max(that.getLaneLength() * laneHeight, laneHeight);
                    chart.style("height", svgHeight());

                    miniClipRect.attr({
                        width: miniWidth,
                        height: miniHeight
                    });
                }

                /**
                 * Creates the containers (`g`'s) for various items.
                 * Does not databind, does not make children.
                 * @param chart
                 * @returns *
                 */
                function createMini(chart) {
                    var mini = chart.append("g")
                        // offset chart by padding amounts
                        .translate([margin.left, margin.top])
                        .classed("mini", true);

                    // mini lanes and text

                    // separator lines between categories
                    mini.append("g").classed("laneLinesGroup", true);

                    // lane label
                    mini.append("g").classed("laneLabelsGroup", true);

                    // mini item rectangles
                    mini.append("g").classed("miniItemsGroup", true);

                    // create interactive brush
                    _lockManualBrush = true;
                    that.brush = d3.svg.brush()
                        // xScale is undefined at this point, it is updated later when data is added
                        .x(xScale)
                        .on("brush", that.display);

                    // create surface for the brush
                    mini.append("g")
                        .classed("x brush", true)
                        .call(that.brush)
                        .clipPath("url(#" + clipId + ")");
                    _lockManualBrush = false;

                    return mini;
                }

                /**
                 * Called when data that drives this control has been updated.
                 * Ensures data is in a digestible format
                 * @param data
                 */
                function updateDataVariables(data) {
                    // public field - share the reference
                    that.items = data.items || [];
                    that.lanes = data.lanes || [];
                    that.maximum = data.maximum;
                    that.minimum = data.minimum;
                }

                /**
                 * Redefines the scales used to render SVG elements.
                 */
                function updateScales() {
                    // a normal linear scale also works
                    xScale = d3.time.scale()
                        .domain([that.minimum, that.maximum])
                        .range([0, miniWidth]);
                    yScale = d3.scale.linear()
                        .domain([0, that.getLaneLength()])
                        .range([0, miniHeight]);

                    // update the brush
                    that.brush.x(xScale);
                }

                /**
                 * Updates the lane lines, lane rects, and text labels in mini elements
                 * @param mini
                 */
                function updateMini(mini) {
                    // separator lines between categories
                    function getSeparatorLineY(d, i) {
                        return yScale(i);
                    }

                    mini.select(".laneLinesGroup")
                        .selectAll()
                        .data(that.lanes)
                        .enter()
                        .append("line")
                        .attr({
                                  x1: 0,
                                  y1: getSeparatorLineY,
                                  x2: miniWidth,
                                  y2: getSeparatorLineY,
                                  class: "laneLines"
                              });

                    // lane labels
                    mini.select(".laneLabelsGroup")
                        .selectAll()
                        .data(that.lanes)
                        .enter()
                        .append("text")
                        .text(dataFunctions.getCategoryName)
                        .attr({
                                  x: -labelRectPadding,
                                  y: function (d, i) {
                                      // 0.5 shifts it halfway into lane
                                      return yScale(i + 0.5);
                                  },
                                  dy: ".5ex",
                                  "text-anchor": "end",
                                  class: "laneText"
                              });

                    // update/redraw mini rectangles
                    var rectAttrs = {
                        "class": function (d) {
                            return "miniItem" + getCategoryIndex(d);
                        },
                        x: function (d) {
                            return xScale(dataFunctions.getLow(d));
                        },
                        y: function (d) {
                            return yScale(getCategoryIndex(d) + lanePaddingDomain);
                        },
                        width: function (d) {
                            return xScale(dataFunctions.getHigh(d)) - xScale(dataFunctions.getLow(d));
                        },
                        height: yScale(1.0 - (2 * lanePaddingDomain))
                    };
                    mini.select(".miniItemsGroup")
                        .selectAll()
                        .data(that.items)
                        .enter()
                        .append("rect")
                        .attr(rectAttrs);

                    // update brush surface
                    mini.select(".brush")
                        .call(that.brush)
                        .selectAll("rect")
                        .attr({
                                  y: 1,
                                  height: miniHeight - 2
                              });
                }

                /**
                 * Updates the brush's extent (positions of minimum and maximum)
                 * and also updates the bounds as data (for binding).
                 */
                function display() {
                    var brushExtent = that.selectedExtent = that.brush.extent();

                    // change the length of brush (repaint it)
                    mini.select(".brush")
                        .call(that.brush.extent(brushExtent));

                    // prevent cyclical updates
                    if (_lockManualBrush) {
                        return;
                    }

                    // update the outside world
                    dataFunctions.extentUpdate(brushExtent, "DistributionOverview");
                }

                // helper functions

                function brushUpdate() {
                    _lockManualBrush = true;
                    that.brush.event(mini);
                    _lockManualBrush = false;
                }

                function getCategoryIndex(d) {
                    return that.lanes.indexOf(dataFunctions.getCategory(d));
                }

                function calculateMiniWidth() {
                    return chart.node().getBoundingClientRect().width - margin.left - margin.right;
                }

                function svgHeight() {
                    return miniHeight + margin.top + margin.bottom;
                }
            };
        }
    ]
).directive(
    "eventDistributionOverview",
    [
        "DistributionOverview",
        function (DistributionOverview) {
            // directive definition object
            return {
                restrict: "EA",
                scope: false,
                require: "^^eventDistribution",
                link: function ($scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];
                    controller.overview = new DistributionOverview(
                        element,
                        controller.data,
                        controller.options.functions,
                        $scope.$id
                    );

                    if (controller.data.items && controller.data.items.length > 0) {
                        controller.overview.updateData(controller.data, controller.currentExtent);
                    }
                }
            };
        }
    ]
);
