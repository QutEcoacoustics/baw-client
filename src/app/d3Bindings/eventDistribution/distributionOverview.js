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
            return function DistributionOverview(target, data, dataFunctions) {
                var that = this,
                    chart,
                    mini,
                    xAxis,
                    miniX,
                    miniY,
                    // this default value will be overwritten almost immediately
                    miniWidth = 1000,
                    // this default value will be overwritten almost immediately
                    miniHeight = 200,
                    xAxisHeight = 60,
                    margin = {
                        top: 5,
                        right: 20,
                        bottom: 5 + xAxisHeight,
                        left: 120
                    },
                    laneHeight = 80,
                    lanePaddingDomain = 0.125,
                    labelRectPadding = 5,
                    container = d3.select(target),
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
                        extentUpdate: function (extent) {
                            console.log("DistributionOverview:extentUpdate: You should override this", extent);
                        }
                    },
                    functions = angular.extend(defaultFunctions, dataFunctions);

                // exports
                that.updateData = updateData;
                that.display = display;
                that.getLaneLength = getLaneLength;
                that.brush = null;
                that.items = null;
                that.lanes = null;
                that.maximum = null;
                that.minimum = null;

                // init
                console.debug("DistributionOverview:created", data);
                create();

                // public functions

                function create() {
                    updateDataVariables(data);

                    chart = createChart();

                    updateDimensions();

                    mini = createMini(chart);
                    xAxis = new TimeAxis(mini, miniX, {y: miniHeight});
                }

                function updateData(data) {
                    updateDataVariables(data);

                    updateDimensions();

                    updateScales();

                    updateMini(mini);

                    if (data && data.items.length > 0) {
                        display();

                        xAxis.update(miniX, [0, miniHeight]);
                    }
                }

                function getLaneLength() {
                    return that.lanes && that.lanes.length || 0;
                }

                // private functions

                function createChart() {
                    var chart = container
                        .append("svg")
                        .classed("chart", true);

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

                    /*// labels - disabled. TODO: turn in to hover text, don't forget to move logic too update
                     // https://github.com/Caged/d3-tip/blob/master/docs/index.md
                     mini.append("g")
                     .attr("id", "miniLabels")
                     .selectAll(".miniLabels")
                     .data(that.items)
                     .enter()
                     .append("text")
                     .text(functions.getId)
                     .attr({
                     x: 0, // TODO: -m[1] === -15
                     y: function (d) {
                     return miniY(getCategoryIndex(d) + 0.5)
                     },
                     dy: ".5ex"
                     });
                     */

                    // create interactive brush
                    that.brush = d3.svg.brush()
                        // miniX is undefined at this point, it is updated later when data is added
                        .x(miniX)
                        .on("brush", that.display);

                    // create surface for the brush
                    mini.append("g")
                        .classed("x brush", true)
                        .call(that.brush);

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
                    that.lanes = d3.set(that.items.map(functions.getCategory)).values();
                    that.maximum = Math.max.apply(null, that.items.map(functions.getHigh, functions));
                    that.minimum = Math.min.apply(null, that.items.map(functions.getLow, functions));
                }

                /**
                 * Redefines the scales used to render SVG elements.
                 */
                function updateScales() {
                    // a normal linear scale also works
                    miniX = d3.time.scale()
                        .domain([that.minimum, that.maximum])
                        .range([0, miniWidth]);
                    miniY = d3.scale.linear()
                        .domain([0, that.getLaneLength()])
                        .range([0, miniHeight]);

                    // update the brush
                    that.brush.x(miniX);
                }

                /**
                 * Updates the lane lines, lane rects, and text labels in mini elements
                 * @param mini
                 */
                function updateMini(mini) {
                    // separator lines between categories
                    function getSeparatorLineY(d, i) {
                        return miniY(i);
                    }

                    mini.select(".laneLinesGroup")
                        .selectAll()
                        .data(that.lanes.concat("fake"))
                        .enter()
                        .append("line")
                        .attr({
                            x1: 0,
                            y1: getSeparatorLineY,
                            x2: miniWidth,
                            y2: getSeparatorLineY,
                            stroke: "lightgray",
                            class: "laneLines"
                        });

                    // lane labels
                    mini.select(".laneLabelsGroup")
                        .selectAll()
                        .data(that.lanes)
                        .enter()
                        .append("text")
                        .text(id)
                        .attr({
                            x: -labelRectPadding,
                            y: function (d, i) {
                                // 0.5 shifts it halfway into lane
                                return miniY(i + 0.5);
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
                            return miniX(functions.getLow(d));
                        },
                        y: function (d) {
                            return miniY(getCategoryIndex(d) + lanePaddingDomain);
                        },
                        width: function (d) {
                            return miniX(functions.getHigh(d)) - miniX(functions.getLow(d));
                        },
                        height: miniY(1.0 - (2 * lanePaddingDomain))
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
                        })
                }

                /**
                 * Updates the brush's extent (positions of minimum and maximum)
                 * and also updates the bounds as data (for binding).
                 *
                 */
                function display() {
                    var brushExtent = that.brush.extent();

                    // change the length of brush (repaint it)
                    mini.select(".brush")
                        .call(that.brush.extent(brushExtent));

                    // update the outside world
                    functions.extentUpdate(brushExtent);
                }

                // helper functions

                function getCategoryIndex(d) {
                    return that.lanes.indexOf(functions.getCategory(d));
                }

                function id(a) {
                    return a;
                }

                function calculateMiniWidth() {
                    return chart.node().getBoundingClientRect().width - margin.left - margin.right;
                }

                function svgHeight() {
                    return miniHeight + margin.top + margin.bottom;
                }
            }
        }
    ]
).directive(
    "eventDistributionOverview",
    [
        "$rootScope",
        "$timeout",
        "DistributionOverview",
        function ($rootScope, $timeout, DistributionOverview) {
            // directive definition object
            return {
                restrict: "EA",
                scope: {
                    data: "=",
                    options: "="
                },
               // controller: "distributionController",
                require:"^^eventDistribution",
                link: function ($scope, $element, attributes, controller, transcludeFunction) {

                    var element = $element[0];
                    $scope.options = $scope.options || {};

                    // TODO: refactor the functions, they should not be data specific in this component
                    var instance = new DistributionOverview(element, {items: $scope.data}, {
                        getId: function (d) {
                            return d.audioId;
                        },
                        getCategory: function (d) {
                            return d.siteId;
                        },
                        getLow: function (d) {
                            if ((typeof d.recordedDate) === "string") {
                                d.recordedDate = new Date(d.recordedDate);
                                d.minimumMilliseconds = d.recordedDate.getTime();
                            }
                            return d.minimumMilliseconds;
                        },
                        getHigh: function (d) {
                            if ((typeof d.durationSeconds) === "string") {
                                d.durationSeconds = Number(d.durationSeconds);
                                d.durationMilliseconds = d.durationSeconds * 1000;
                            }
                            return this.getLow(d) + d.durationMilliseconds;
                        },
                        getText: function (d) {
                            return d.audioId;
                        },
                        extentUpdate: function (newExtent) {
                            function update() {
                                $scope.options.overviewExtent = newExtent;
                            }

                            if (!$scope.$root.$$phase) {
                                $scope.$apply(update);
                            }
                            else {
                                $scope.$eval(update);
                            }
                        }
                    });

                    console.debug("test", $scope.test);

                    // only watches changes to object reference
                    $scope.$watch(function () {
                        return $scope.data;
                    }, function (newValue, oldValue) {
                        instance.updateData({items: $scope.data});
                    });

                }
            }
        }
    ]
);