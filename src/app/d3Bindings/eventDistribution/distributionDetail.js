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
                var self = this,
                    container = d3.select(target),
                    isItemsToRender,
                    chart,
                    main,
                    mainClipRect,
                    clipId = "distributionDetail_" + uniqueId,
                    xAxis,
                    xScale,
                    yScale,
                    zoom,
                    zoomSurface,
                // 6 hours - from edge to edge of the graph.
                    zoomLimitSeconds = 6 * 60 * 60,
                    visualizationDuration = null,
                // HACK: a "lock" placed around the invocation of manual zoom events. Assumes synchronicity.
                    _lockManualZoom = false,
                    laneLinesGroup,
                    laneLabelsGroup,
                    visualizationBrushArea,
                    visualizationBrushLaneOverlay,
                    mainItemsGroup,
                    outOfBoundsRect,
                    datasetBoundsRect,
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
                    mainHeight = 0,

                    laneHeight = 100,
                    lanePaddingDomain = 0.1;

                // exports
                self.updateData = updateData;
                self.updateExtent = updateExtent;
                self.updateVisualisationDuration = updateVisualisationDuration;
                self.items = [];
                self.lanes = [];
                self.minimum = null;
                self.maximum = null;
                self.visibleExtent = null;
                self.selectedCategory = null;

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
                    if (extent.length != 2) {
                        throw new Error("Can't handle this many dimensions");
                    }

                    if (extent[0] === self.visibleExtent[0] && extent[1] === self.visibleExtent[1]) {
                        console.debug("DistributionDetail:updateExtent: update skipped");
                        return;
                    }

                    self.visibleExtent = extent;

                    updateScales();

                    extentUpdateMain();
                }

                function updateVisualisationDuration(newDuration) {
                    // update internal tracking value
                    visualizationDuration = newDuration;

                    // repaint visualisation brush
                    if (isItemsToRender) {
                        updateVisualizationBrush();
                    }
                }

                // other functions
                function create() {

                    createChart();

                    updateDimensions();

                    createMain();
                }

                function createChart() {
                    chart = container.append("svg")
                        .classed("chart", true)
                        .attr("width", mainWidth)
                        .attr("height", mainHeight);

                    mainClipRect = chart.append("defs")
                        .append("clipPath")
                        .attr("id", clipId)
                        .append("rect")
                        .attr({
                            width: mainWidth,
                            height: mainHeight
                        });
                }

                function updateDimensions() {
                    mainWidth = calculateMainWidth();
                    mainHeight = Math.max(getLaneLength() * laneHeight, laneHeight);

                    var dims = {
                        width: mainWidth,
                        height: mainHeight
                    };

                    mainClipRect.attr(dims);
                    if (zoomSurface) {
                        zoomSurface.attr(dims);
                    }
                    if (visualizationBrushArea) {
                        visualizationBrushArea.attr("height", dims.width);
                    }
                    if (outOfBoundsRect) {
                        outOfBoundsRect.attr(dims);
                    }
                    if (datasetBoundsRect) {
                        // width is updated by updateMain
                        datasetBoundsRect.attr("height", mainHeight);
                    }

                    chart.style("height", svgHeight() + "px");

                    if (zoom) {
                        zoom.size([mainWidth, mainHeight]);
                    }
                }

                function createMain() {
                    // create main surface
                    main = chart.append("g")
                        .attr("width", mainWidth)
                        .attr("height", mainHeight)
                        .classed("main", true)
                        .translate([margin.left, margin.top]);

                    // zoom behaviour
                    zoom = d3.behavior.zoom()
                        //.scaleExtent([self.minimum, self.maximum])
                        .size([mainWidth, mainHeight])
                        .on("zoomstart", onZoomStart)
                        .on("zoom", onZoom)
                        .on("zoomend", onZoomEnd);
                    zoom(main);

                    zoomSurface = main.append("rect")
                        .attr({
                            width: mainWidth,
                            height: mainHeight,
                            fill: "white",
                            opacity: 1.0
                        })
                        .classed("zoomSurface", true);

                    outOfBoundsRect = main.append("rect")
                        .attr({
                            height: mainHeight,
                            width: mainWidth,
                            x: 0,
                            y: 0
                        })
                        .classed("outOfBounds", true);

                    datasetBoundsRect = main.append("rect")
                        .attr({
                            height: mainHeight,
                            width: mainWidth,
                            x: 0,
                            y: 0
                        })
                        .classed("datasetBounds", true);

                    // rect for showing visualisation extent
                    visualizationBrushArea = main.append("g")
                        .clipPath("url(#" + clipId + ")")
                        .append("rect")
                        .classed("visualizationBrushArea", true)
                        .attr("height", mainHeight);

                    // group for separator lines between lanes/categories
                    laneLinesGroup = main.append("g").classed("laneLinesGroup", true);

                    // group for textual labels, left of the lanes
                    laneLabelsGroup = main.append("g").classed("laneLabelsGroup", true);

                    // group for rects painted in lanes
                    mainItemsGroup = main.append("g")
                        .clipPath("url(#" + clipId + ")")
                        .classed("mainItemsGroup", true);

                    // rect for showing selected lane (and visualization brush bounds)
                    visualizationBrushLaneOverlay = main.append("g")
                        .clipPath("url(#" + clipId + ")")
                        .append("rect")
                        .classed("visualizationBrushLaneOverlay", true)
                        .attr("height", laneHeight);

                    xAxis = new TimeAxis(main, xScale, {position: [0, mainHeight], isVisible: false});
                }

                function updateDataVariables(data) {
                    // public field - share the reference
                    self.items = data.items || [];
                    self.lanes = data.lanes || [];
                    self.maximum = data.maximum;
                    self.minimum = data.minimum;
                    self.selectedCategory = self.lanes[0];

                    isItemsToRender = self.items && self.items.length > 0;
                }

                function updateScales() {
                    self.visibleExtent = self.visibleExtent || [self.minimum, self.maximum];

                    if (!xScale) {
                        xScale = d3.time.scale();

                    }
                    xScale.domain([self.minimum, self.maximum])
                        .range([0, mainWidth]);

                    // update the zoom behaviour
                    zoom.x(xScale);
                    var zf = getZoomFactors([self.minimum, self.maximum], self.visibleExtent, zoomLimitSeconds);
                    zoom.scaleExtent(zf.scaleExtent);
                    zoom.scale(zf.currentScale);
                    setZoomTranslate(zf.dateTranslate);

                    // falsely trigger zoom events to force d3 to re-render with new scale
                    zoomUpdate();

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
                        .data(self.lanes)
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
                        .data(self.lanes)
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
                    var visibleItems = self.items.filter(isRectVisible);

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

                    // finally update the axis and other details
                    if (isItemsToRender) {
                        updateVisualizationBrush();

                        // update datasetBounds
                        // effect a manual clip on the range
                        var dbMinimum = Math.max(self.visibleExtent[0], self.minimum);
                        var dbMaximum = Math.min(self.visibleExtent[1], self.maximum);
                        xScale.clamp(true);
                        datasetBoundsRect.attr({
                            x: xScale(dbMinimum),
                            width: Math.max(0, xScale(dbMaximum) - xScale(dbMinimum))
                        });
                        xScale.clamp(false);

                        var domain = xScale.domain(),
                        // intentionally falsey
                            showAxis = domain[1] - domain[0] != 0; // jshint ignore:line

                        xAxis.update(xScale, [0, mainHeight], showAxis);
                    }
                }

                function updateVisualizationBrush() {
                    var domain = xScale.domain(),
                        middle = +domain[0] + ((+domain[1] - +domain[0]) / 2.0),
                        halfVis = visualizationDuration * 1000 / 2.0,
                        left = xScale(middle - halfVis),
                        right = xScale(middle + halfVis),
                        width =  right - left;
                        //center = left + (width / 2.0);

                    // update the width of the extent marker
                    // correct offset of brush
                    visualizationBrushArea.attr("width", width).translate([left, 0]);

                    // also update the top translation to select a lane
                    var top = yScale(self.lanes.indexOf(self.selectedCategory));
                    visualizationBrushLaneOverlay.attr("width", width).translate([left, top]);
                }

                function onZoomStart() {
                    //console.debug("DistributionDetail:zoomStart:", d3.event.translate, d3.event.scale);// update which lane is shown in visualisation
                    switchSelectedCategory();

                }

                function onZoom() {
                    // the xScale is automatically updated
                    // now just rerender everything

                    // HACK: check whether this event was triggered manually
                    var isManual = _lockManualZoom;

                    // prevent translating off the edge of our data (i.e. clamp the zoom/pan)
                    var domain = null;
                    if (xScale) {
                        zoom.translate(panLimit());
                        domain = xScale.domain();
                    }

                    //console.debug("DistributionDetail:zoom:", d3.event.translate, d3.event.scale, domain, zoom.translate(), isManual);

                    // don't propagate cyclical events
                    if (isManual) {
                        return;
                    }

                    // updates the public visibleExtent field - has no effect on the graph
                    self.visibleExtent = domain;

                    // update which lane is shown in visualisation
                    switchSelectedCategory();

                    // updates the controller - bind back
                    dataFunctions.extentUpdate(self.visibleExtent, "DistributionDetail");

                    // redraw elements and axes
                    extentUpdateMain();
                }

                function onZoomEnd() {
                    //console.debug("DistributionDetail:zoomEnd:", d3.event.translate, d3.event.scale);

                    if (isItemsToRender) {
                        dataFunctions.extentUpdate(self.visibleExtent, "DistributionDetail");
                    }
                }

                /**
                 * Constrains the zoom's translation.
                 * Clamp at each end is set to the opposite edge of the visualization brush
                 * Adapted from: http://bl.ocks.org/garrilla/11280861
                 * @returns {*[]}
                 */
                function panLimit() {
                    var tx, ty = 0,
                        xDomain = xScale.domain(),
                        x1 = +xDomain[1],
                        x0 = +xDomain[0],
                        halfDomainDuration = (x1 - x0) / 2.0;

                    // extent allowable pan range by half of the current on-screen visible domain
                    var panExtent0 = self.minimum - halfDomainDuration,
                        panExtent1 = self.maximum + halfDomainDuration;

                    if (x0 < panExtent0) {
                        tx = xScale(self.minimum - (panExtent0 - x0));
                    } else if (x1 > panExtent1) {
                        tx = xScale((panExtent1 - self.maximum) + x1 - (panExtent1 - panExtent0));
                    } else {
                        tx = zoom.translate()[0];
                    }

                    return [tx, ty];
                }

                function switchSelectedCategory() {
                    if (yScale) {
                        //console.debug("DistributionDetail:Category switch");
                        var rounded = 0;
                        if (!_lockManualZoom) {
                            var mouseY = d3.mouse(main[0][0])[1];
                            var inverted = yScale.invert(mouseY);
                            rounded = Math.floor(inverted);
                        }

                        var newCategory = self.lanes[rounded] || self.selectedCategory;

                        if (newCategory !== self.selectedCategory) {
                            // update public field - this will allow us to switch which
                            // lane is shown based on where an interaction happens on the drawing surface
                            self.selectedCategory = newCategory;
                            updateVisualizationBrush();
                        }
                    }
                }

                function getZoomFactors(fullExtent, visibleExtent, limitSeconds) {
                    var vl = +visibleExtent[0],
                        vh = +visibleExtent[1],
                        fullDifference = (+fullExtent[1]) - (+fullExtent[0]),
                        visibleDifference = vh - vl;
                    var limit = limitSeconds * 1000;

                    /*
                     [0, 1] adjusts zoom to be wider than specified extent (zoom out)
                     (1, 1) is zoomScale where zoom == specified extent
                     [1, ∞] adjusts zoom to be narrower than specified extent (zoom in)

                     after zoom changes, the visible extent also changes
                     */

                    var scaleLower = 1,
                        scaleUpper = fullDifference / limit,
                        currentScale = fullDifference / visibleDifference,
                        tx = vl;

                    if (scaleUpper == -Infinity) {
                        scaleUpper = Infinity;
                    }

                    if (tx == Infinity || isNaN(tx)) {
                        tx = 0;
                    }

                    if (currentScale == Infinity || currentScale == -Infinity || isNaN(currentScale)) {
                        currentScale = 1;
                    }

                    console.debug("DistributionDetail:getZoomFactors:", scaleLower, scaleUpper, currentScale, new Date(tx).toISOString());

                    return {
                        scaleExtent: [scaleLower, scaleUpper],
                        currentScale: currentScale,
                        dateTranslate: tx
                    };
                }

                function zoomUpdate() {
                    _lockManualZoom = true;
                    zoom.event(main);
                    _lockManualZoom = false;
                }

                function setZoomTranslate(dateOffset) {
                    zoom.translate([-xScale(dateOffset), 0]);
                }

                function isRectVisible(d) {
                    return dataFunctions.getLow(d) < self.visibleExtent[1] &&
                        dataFunctions.getHigh(d) > self.visibleExtent[0];
                }

                function getCategoryIndex(d) {
                    return self.lanes.indexOf(dataFunctions.getCategory(d));
                }

                function getLaneLength() {
                    return self.lanes && self.lanes.length || 0;
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
            };
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