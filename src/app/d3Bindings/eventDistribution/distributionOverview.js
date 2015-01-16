/**
 * Created by Anthony.
 *
 * Intended to provide a high level overview of a distribution of
 * time-based events/records. Has zoom/filter controls that update a shared controller/scope
 * which the eventDistributionDetail directive renders.
 */
angular
    .module("bawApp.d3.eventDistribution.distributionOverview", [])
    .directive(
    "eventDistributionOverview",
    [
        "d3",
        "moment",
        function (d3, moment) {
            // main functions

            function DistributionOverview(target, data, dataFunctions) {
                var that = this,
                    chart = null,
                    mini = null,
                    itemRects = null,
                    miniHeight = null,
                    miniX, miniY,
                    width = 1000,
                    height = 200,
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
                        }
                    },
                    functions = angular.extend(defaultFunctions, dataFunctions);

                // exports
                that.updateData = updateData;
                that.display = display;
                that.getLaneLength = getLaneLength;
                that.items = null;
                that.lanes = null;
                that.maximum = null;
                that.minimum = null;


                // init
                console.debug("DistributionOverview:created", data);

                updateDataVariables(data);
                create();
                display();


                // functions
                function updateData(data) {
                    console.debug("DistributionOverview:data updated", data);
                    updateDataVariables(data);

                    updateMini(mini);
                }

                function updateDataVariables(data) {
                    // public field - share the reference
                    that.items = data.items || [];
                    that.lanes = d3.set(that.items.map(functions.getCategory));
                    that.maximum = Math.max.apply(null, that.items.map(functions.getHigh));
                    that.minimum = Math.min.apply(null, that.items.map(functions.getLow));
                    miniHeight = (that.getLaneLength() * 12) + 50;

                    // scales
                    // start and end values my be in the same range as the difference between start and end values
                    miniX = d3.scale.linear()
                        .domain([that.minimum, that.maximum])
                        .range([0, width]);
                    /*x1 = d3.scale.linear()
                     .range([0, width]);*/
                    /*y1 = d3.scale.linear()
                     .domain([0, that.getLaneLength()])
                     .range([0, height]);*/
                    miniY = d3.scale.linear()
                        .domain([0, that.getLaneLength()])
                        .range([0, height]);
                }

                function create() {
                    chart = createChart();
                    setSvgWidth(width);

                    mini = createMini(chart);
                    itemRects = createItemRects(chart, mini);

                    updateDimensions();
                }

                function createChart() {
                    var chart = container
                        .append("svg")
                        .classed("chart", true);

                    // create a resuable clip path - used only for main, not part of this control
                    chart.append("defs")
                        .append("clipPath")
                        .attr("id", "clip")
                        .append("rect");

                    return chart;
                }

                function setSvgWidth(width) {
                    chart.style("width", width);
                }

                function getLaneLength() {
                    return that.lanes && that.lanes.size() || 0;
                }

                function updateDimensions() {
                    chart.select("#clip")
                        .attr({
                                  width: width,
                                  height: height
                              });

                }

                function createMini(chart) {
                    console.debug("DistributionOverview:createMini");
                    var mini = chart.append("g")
                        .classed("mini", true);

                    // mini lanes and text
                    mini.append("g")
                        .classed("laneLinesGroup", true)
                        .selectAll(".laneLines");


                    mini.append("g")
                        .classed("lanesGroup", true)
                        .data(that.lanes)
                        .enter()
                        .append("text")
                        .text(d3.identity)
                        .attr({
                                  x: 0, // -m[1]
                                  y: function (d, i) {
                                      return miniY(i + 0.5);
                                  },
                                  dy: ".5ex",
                                  "text-anchor": "end"
                              })
                        .classed("laneText", true);

                    mini.append("g")
                        .classed("lanesText", true)
                        .selectAll(".laneText")
                        .data(that.lanes)
                        .enter()
                        .append("text")
                        .text(d3.identity)
                        .attr({
                                  x: 0, // -m[1]
                                  y: function (d, i) {
                                      return miniY(i + 0.5);
                                  },
                                  dy: ".5ex",
                                  "text-anchor": "end"
                              })
                        .classed("laneText", true);

                    return mini;
                }

                function updateMini(mini) {
                    // mini lanes and text
                    mini.select(".laneLinesGroup")
                        .data(that.items)
                        .enter()
                        .append("line")
                        .attr({
                                  x1: 0,
                                  y1: function (d) {
                                      return miniY(functions.getCategory(d));
                                  },
                                  x2: 100, // width,
                                  y2: function (d) {
                                      return miniY(functions.getCategory(d));
                                  },
                                  "stroke": "lightgray"
                              });
                }

                function createItemRects(chart, mini) {
                    console.debug("DistributionOverview:createItemRects");
                    var itemRects = chart.append("g")
                        .attr("clip-path", "url(#clip)");

                    // mini item rectangles
                    var rectAttrs = {
                        "class": function (d) {
                            return "miniItem" + functions.getCategory(d);
                        },
                        x: function (d) {
                            x1(functions.getLow(d))
                        },
                        y: function (d) {

                        },
                        width: function (d) {

                        },
                        height: 10
                    };
                    mini.append("g")
                        .attr("id", "miniItems")
                        .selectAll("miniItems")
                        .data(that.items)
                        .enter()
                        .append("rect")
                        .attr(rectAttrs);

                    // labels
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
                                      return miniY(functions.getCategory(d) + 0.5)
                                  },
                                  dy: ".5ex"
                              });

                    that.brush = d3.svg.brush()
                        .x(miniX)
                        .on("brush", that.display);

                    mini.append("g")
                        .classed("x brush", true)
                        .call(that.brush)
                        .selectAll("rect")
                        .attr({
                                  y: 1,
                                  height: miniHeight - 1
                              });

                    return itemRects;
                }


                function display() {
                    console.debug("DistributionOverview:display");
                    //var rects,
                    //    labels,
                    //    brushExtent = that.brush.extent(),
                    //    minExtent = brushExtent[0],
                    //    maxExtent = brushExtent[1],
                    //    visibleItems = that.items.filter(function (d) {
                    //        return functions.getLow(d) < maxExtent && functions.getHigh(d) > minExtent;
                    //    }),
                    //    getX = function (d) {
                    //        return x1(functions.getLow(d));
                    //    },
                    //    getWidth = function (d) {
                    //        return x1(functions.getHigh(d)) - x1(functions.getLow(d));
                    //    };
                    //
                    //mini.select(".brush")
                    //    .call(that.brush.extent(brushExtent));
                    //
                    //// redefine the x-domain
                    //x1.domain(brushExtent);
                    //
                    ////update main item rects
                    //
                    //rects = itemRects.selectAll("rect")
                    //    .data(visibleItems, functions.getId)
                    //    .attr("x", getX)
                    //    .attr("width", getWidth);
                    //
                    //rects.enter().append("rect")
                    //    .attr("class", function (d) {
                    //              return "miniItem" + functions.getCategory(d);
                    //          })
                    //    .attr("x", getX)
                    //    .attr("y", function (d) {
                    //              return y1(functions.getCategory(d)) + 10;
                    //          })
                    //    .attr("width", getWidth)
                    //    .attr("height", function (d) {
                    //              return 0.8 * y1(1);
                    //          });
                    //
                    //rects.exit().remove();
                    //
                    ////update the item labels
                    //labels = itemRects.selectAll("text")
                    //    .data(visibleItems, functions.getId)
                    //    .attr("x", function (d) {
                    //              return x1(Math.max(functions.getLow(d), minExtent) + 2);
                    //          });
                    //
                    //labels.enter().append("text")
                    //    .text(functions.getId)
                    //    .attr("x", function (d) {
                    //              return x1(Math.max(functions.getLow(d), minExtent));
                    //          })
                    //    .attr("y", function (d) {
                    //              return y1(functions.getCategory(d) + 0.5);
                    //          })
                    //    .attr("text-anchor", "start");
                    //
                    //labels.exit().remove();

                }




            }

            // directive definition object
            return {
                restrict: "EA",
                scope: {
                    data: "="
                },
                link: function ($scope, $element, attributes, controller, transcludeFunction) {

                    var element = $element[0];

                    // TODO: refactor the functions, they should not be data specific
                    var instance = new DistributionOverview(element, {items: $scope.data}, {
                        getId: function (d) {
                            return d.audioId;
                        },
                        getCategory: function (d) {
                            return d.siteId;
                        },
                        getLow: function (d) {
                            if (d.recordedDate instanceof String) {
                                d.recordedDate = new Date(d.recordedDate);
                                d.minimum = d.getTime();
                            }
                            return d.minimum;
                        },
                        getHigh: function (d) {
                            if (d.duration instanceof String) {
                                d.duration = Number(d.duration);
                                d.durationMilliseconds = d.duration * 1000;
                            }
                            return d.minimum + d.durationMilliseconds;
                        },
                        getText: function (d) {
                            return d.audioId;
                        }
                    });

                    // only watches changes to object reference
                    $scope.$watch(function () {
                        return $scope.data;
                    }, function (newValue, oldValue) {
                        instance.updateData({items: $scope.data});
                    });

                },
                controller: "distributionController"

            }
        }
    ]
);