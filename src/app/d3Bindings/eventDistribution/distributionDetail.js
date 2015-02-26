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
                    mainClipRect,
                    clipId = "distributionDetail_" + uniqueId,
                    xAxis,
                    xScale,
                    yScale,
                    zoom,
                    zoomSurface,
                // 6 hours - from edge to edge of the graph.
                    zoomLimitSeconds = 6 * 60 * 60,
                // HACK: a "lock" placed around the invocation of manual zoom events. Assumes synchronicity.
                    _lockManualZoom = false,
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
                    lanePaddingDomain = 0.1;

                // exports
                this.updateData = updateData;
                this.updateExtent = updateExtent;
                this.items = [];
                this.lanes = [];
                this.minimum = null;
                this.maximum = null;
                this.visibleExtent = null;
                this.selectedCategory = null;

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

                    if (extent[0] === that.visibleExtent[0] && extent[1] === that.visibleExtent[1]) {
                        console.debug("DistributionDetail:updateExtent: update skipped");
                        return;
                    }

                    that.visibleExtent = extent;

                    updateScales();

                    extentUpdateMain();


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
                        //.scaleExtent([that.minimum, that.maximum])
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

                    // group for separator lines between lanes/categories
                    laneLinesGroup = main.append("g").classed("laneLinesGroup", true);

                    // group for textual labels, left of the lanes
                    laneLabelsGroup = main.append("g").classed("laneLabelsGroup", true);

                    // group for rects painted in lanes
                    mainItemsGroup = main.append("g")
                        .clipPath("url(#" + clipId + ")")
                        .classed("mainItemsGroup", true);

                    xAxis = new TimeAxis(main, xScale, {position: [0, mainHeight], isVisible: false});
                }

                function updateDataVariables(data) {
                    // public field - share the reference
                    that.items = data.items || [];
                    that.lanes = data.lanes || [];
                    that.maximum = data.maximum;
                    that.minimum = data.minimum;
                    that.selectedCategory = that.lanes[0];
                }

                function updateScales() {
                    that.visibleExtent = that.visibleExtent || [that.minimum, that.maximum];

                    if (!xScale) {
                        xScale = d3.time.scale();

                    }
                    xScale.domain([that.minimum, that.maximum])
                        .range([0, mainWidth]);

                    // update the zoom behaviour
                    zoom.x(xScale);
                    var zf = getZoomFactors([that.minimum, that.maximum], that.visibleExtent, zoomLimitSeconds);
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
                            showAxis = domain[1] - domain[0] != 0; // jshint ignore:line

                        xAxis.update(xScale, [0, mainHeight], showAxis);
                    }

                }

                function onZoomStart() {

                    console.debug("DistributionDetail:zoomStart:", d3.event.translate, d3.event.scale);
                }

                function onZoom() {
                    // the xScale is automatically updated
                    // now just rerender everything

                    // HACK: check whether this event was triggered manually
                    var isManual = _lockManualZoom;

                    // prevent translating off the edge of our data (i.e. clamp the zoom)
                    var domain = null;
                    if (xScale) {
                        zoom.translate(panLimit());
                        domain = xScale.domain();
                    }

                    console.debug("DistributionDetail:zoom:", d3.event.translate, d3.event.scale, domain, isManual);

                    // don't propagate cyclical events
                    if (isManual) {
                        return;
                    }

                    // updates the public visibleExtent field - has no effect on the graph
                    that.visibleExtent = domain;

                    // update public field - this will allow us to switch which
                    // lane is shown based on where an interaction happens on the drawing surface
                    var mouseY = d3.mouse(main[0][0])[1],
                        inverted = yScale.invert(mouseY),
                        rounded = Math.floor(inverted);
                    that.selectedCategory = that.lanes[rounded];


                    // updates the controller - bind back
                    dataFunctions.extentUpdate(that.visibleExtent, "DistributionDetail");

                    // redraw elements and axes
                    extentUpdateMain();
                }

                /**
                 * Constrains the zoom's translation.
                 * Adapted from: http://bl.ocks.org/garrilla/11280861
                 * @returns {*[]}
                 */
                function panLimit() {
                    var tx, ty = 0,
                        zoomScale = zoom.scale(),
                        xDomain = xScale.domain(),
                        x1 = xDomain[1],
                        x0 = xDomain[0],
                        panExtent1 = that.maximum,
                        panExtent0 = that.minimum,
                        divisorWidth = mainWidth / ((x1 - x0) * zoomScale),
                        minX = -(((x0 - x1) * zoomScale) + (panExtent1 - (panExtent1 - (mainWidth / divisorWidth)))),
                        maxX = -(((x0 - x1)) + (panExtent1 - panExtent0)) * divisorWidth * zoomScale;


                    if (x0 < panExtent0) {
                        tx = minX;
                    } else if (x1 > panExtent1) {
                        tx = maxX;
                    } else {
                        tx = zoom.translate()[0];
                    }

                    return [tx, ty];
                }

                function onZoomEnd() {
                    console.debug("DistributionDetail:zoomEnd:", d3.event.translate, d3.event.scale);
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
                    zoom.translate([-xScale(dateOffset), 0])
                }

                function isRectVisible(d) {
                    return dataFunctions.getLow(d) < that.visibleExtent[1] &&
                        dataFunctions.getHigh(d) > that.visibleExtent[0];
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