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
            "$window",
            "$timeout",
            "conf.constants",
            "d3",
            "humanize-duration",
            "customMultiDateFormat",
            "TimeAxis",
            "MeasureWidget",
            "FocusStem",
            "distributionCommon",
            "distributionTilingFunctions",
            function ($window, $timeout, constants, d3, humanizeDuration, customMultiDateFormat, TimeAxis, MeasureWidget,
                      FocusStem, common, TilingFunctions) {
                return function DistributionDetail(target, data, dataFunctions, uniqueId) {
                    var self = this,
                        container = d3.select(target),
                        isItemsToRender,
                        chart,
                        main,
                        mainClipRect,
                        clipClass = "clippedToVisibleBounds",
                        outerClipId = "distributionDetail_" + uniqueId,
                        /**
                         * A widget used to display bounds information
                         */
                        mainMeasure,
                        xAxis,
                        /**
                         * The 'top' x axis for the currently selected lane.
                         */
                        xAxisSelected,
                        focusStem,
                        yAxisFrequency,
                        yAxisGroup,
                        yAxisFrequencyLabel,
                        xScale = d3.time.scale(),
                        yScale = d3.scale.linear(),
                        zoom,
                        /**
                         * a static surface for interactivity
                         */
                        zoomSurface,
                        /**
                         * 30 seconds - from edge to edge of the graph.
                         * Updated when zoom is calculated - is based off highest resolution
                         * from `self.availableResolutions`
                         * @type {number}
                         */
                        zoomLimitSeconds = 30,
                        visualizationDuration = null,
                    // HACK: a "lock" placed around the invocation of manual zoom events. Assumes synchronicity.
                        _lockManualZoom = false,
                        /**
                         * HACK: a flag used to disambiguate between clicks and drags.
                         * @type {Number}
                         * @private
                         */
                        _isZooming = null,
                        _hasMouseMoved = null,
                        //_navigateTimeoutPromise = null,
                        laneLinesGroup,
                        laneLabelsGroup,
                        labels,
                        labelBackgrounds,
                        visualizationBrushArea,
                        visualizationBrushLaneOverlay,
                        mainItemsGroup,
                        tilesGroup,
                        /**
                         * A clip for the tiles group
                         */
                        tilesClipRect,
                        tilesGroupClipId = "distributionDetailTilesGroup_" + uniqueId,
                        /**
                         * color shown when outside of dataset
                         *  this surface is fixed (not animated)
                         */
                        outOfBoundsRect,
                        /**
                         * background color for areas within the dataset
                         * missing audio falls through to this surface
                         * this surface is animated (at the edges of the dataset)
                         */
                        datasetBoundsRect,

                    // these are initial values only
                    // this is the width and height of the main group
                        mainWidthPixels = 1200,
                        mainHeight = 100,

                        orderedLaneIndexes = [],
                        orderedLaneHeights = [],
                        yRange = [],
                        tileWidthPixels = 180,
                        tileCount = 0,
                        yScaleForTiles = d3.scale.linear(),
                        resolutionScale = d3.scale.threshold(),
                        tilingFunctions = null,
                        visibleTiles = [],
                        /**
                         * A mirror of self.items in a R*-Tree format
                         */
                        itemsTree
                        ;

                    const
                        /**
                         * The threshold for downloading images.
                         * It is a ratio (e.g. 0.05 = 5% of normal width)
                         * @type {number}
                         */
                        imageVisibilityThreshold = 0.05,
                        dateTimeFormatD3 = d3.time.format(constants.localization.dateTimeFormatD3),
                        timeFormatter = d3.time.format(constants.localization.timeFormatD3),
                        axisPadding = 9,
                        fontLineHeight = 17,
                        fontHeight = 14,
                        lanePaddingTop = 4,
                        lanePaddingBottom = 4,
                        lanePadding = lanePaddingTop + lanePaddingBottom,
                        laneHeight = 24,
                        xAxisHeight = 26,
                        focusStemHeight = xAxisHeight + 2 + (fontLineHeight),
                        yAxisWidth = 55,
                        measureHeight = 16,
                        measureOverLap = 0,
                        margin = {
                            top: 5 + measureHeight - measureOverLap,
                            right: 5,
                            bottom: 5 + xAxisHeight,
                            left: yAxisWidth + 5
                        },
                        laneLabelMarginRight = margin.left,

                        /**
                         * A cache of tiles generated from items.
                         * @type {WeakMap<item, Map<resolution, Array<tiles>>>}
                         */
                        tileCache = new WeakMap();
                        //clickOrDblTimeoutMilliseconds = 300,
                        //clickOrDragThresholdPixels = 1;

                    // exports
                    self.updateData = updateData;
                    self.updateExtent = updateExtent;
                    self.updateVisualisationDuration = updateVisualisationDuration;
                    self.items = [];
                    self.lanes = [];
                    self.minimum = null;
                    self.maximum = null;
                    /**
                     * The currently visible extent.
                     * @type {Array<Date>}
                     */
                    self.visibleExtent = [0, 0];
                    self.selectedCategory = null;
                    self.currentZoomValue = 1;
                    /**
                     * A point in the x domain representing the last point of interaction
                     * from the user.
                     * @type {null}
                     */
                    self.focus = null;

                    // init
                    create();

                    // exported functions

                    function updateData(data) {
                        updateDataVariables(data);

                        updateDimensions();

                        updateExtent(self.visibleExtent);
                    }

                    function updateExtent(extent) {
                        if (extent.length !== 2) {
                            throw new Error("Can't handle this many dimensions");
                        }

                        // de-dupe
                        if (extent[0] === self.visibleExtent[0] && extent[1] === self.visibleExtent[1]) {
                            console.debug("DistributionDetail:updateExtent: update skipped");
                            return;
                        }

                        // if there is no visible extent set, zoom out to full data set
                        // warning this resets the zoom level
                        // though it should only take effect when visible extent === 0
                        if (!self.visibleExtent || +self.visibleExtent[1] - +self.visibleExtent[0] === 0) {
                            self.visibleExtent = [self.minimum, self.maximum];
                        }

                        updateExtentInternal(extent, {dataChanged: true, categoryChanged: true, zoomChanged: true});

                    }

                    /**
                     * Called from user triggered events through zoomEvents
                     */
                    function updateExtentInternal(extent, {dataChanged, categoryChanged, zoomChanged}) {
                        if (dataChanged) {
                            if (!categoryChanged || !zoomChanged) {
                                throw new Error("Invalid update state");
                            }
                        }

                        // update public property
                        self.visibleExtent = extent;

                        // finally, convert to seconds
                        self.visibleDuration = (+self.visibleExtent[1] - +self.visibleExtent[0]) / common.msInS;

                        // TODO: snap tile domain to zoom levels that are available
                        self.tileSizeSeconds = self.visibleDuration / tilingFunctions.getTileCountForWidth(mainWidthPixels, tileWidthPixels);
                        self.resolution = self.tileSizeSeconds / tileWidthPixels;

                        // update scales
                        if (dataChanged) {
                            updateScales();
                        }

                        // force zoom to update (not triggered internally)
                        if (dataChanged || zoomChanged) {
                            updateZoom();
                        }

                        // update yScales and y-axis
                        if (dataChanged || categoryChanged) {
                            updateYScales();
                        }

                        // recalculate what tiles are visible
                        //visibleTiles = tilingFunctions.filterTiles(self.tileSizeSeconds, self.resolution, self.items,
                        // self.visibleExtent, self.selectedCategory);
                        visibleTiles = tilingFunctions.filterTilesRTree(
                            self.tileSizeSeconds,
                            self.resolution,
                            itemsTree,
                            self.visibleExtent,
                            self.selectedCategory
                        );

                        if (categoryChanged) {
                            updateMain(dataChanged);
                        }

                        renderRects();

                        // do the tiling!
                        renderTileElements();

                        renderFocusGroup();

                        // finally update the axis and other details
                        if (isItemsToRender) {
                            renderAxisAndChrome();
                        }
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

                        // note this depends on the inputs being updated by reference
                        // or remaining constant
                        tilingFunctions = new TilingFunctions(dataFunctions, yScale, xScale, tileCache, resolutionScale, tileWidthPixels, true);

                        createChart();

                        updateDimensions();

                        createMain();
                    }

                    function createChart() {
                        chart = container.append("svg")
                            .classed("chart", true)
                            .attr("width", mainWidthPixels)
                            .attr("height", mainHeight);

                        mainClipRect = chart.append("defs")
                            .append("clipPath")
                            .attr("id", outerClipId)
                            .append("rect")
                            .attr({
                                width: mainWidthPixels,
                                height: mainHeight
                            });

                        tilesClipRect = chart.select("defs")
                            .append("clipPath")
                            .attr("id", tilesGroupClipId)
                            .append("rect")
                            .attr({
                                width: mainWidthPixels,
                                height: mainHeight
                            });
                    }

                    function updateDimensions() {
                        mainWidthPixels = common.getWidth(container, margin);
                        tileCount = tilingFunctions.getTileCountForWidthRounded(mainWidthPixels, tileWidthPixels);

                        mainHeight = Math.max(getLaneLength() - 1, 0) * getLaneHeight() + getFocusedLaneHeight();

                        var dims = {
                            width: mainWidthPixels,
                            height: mainHeight
                        };

                        mainClipRect.attr(dims);
                        if (zoomSurface) {
                            zoomSurface.attr(dims);
                        }
                        if (visualizationBrushArea) {
                            visualizationBrushArea.attr("height", dims.height);
                        }
                        if (visualizationBrushLaneOverlay) {
                            visualizationBrushLaneOverlay.attr("height", getFocusedLaneHeight());
                        }
                        if (outOfBoundsRect) {
                            outOfBoundsRect.attr(dims);
                        }
                        if (datasetBoundsRect) {
                            // width is updated by updateMain
                            datasetBoundsRect.attr("height", mainHeight);
                        }
                        if (mainMeasure) {
                            mainMeasure.update({width: mainWidthPixels});
                        }

                        chart.style("height", common.svgHeight(mainHeight, margin) + "px");

                        if (zoom) {
                            zoom.size([mainWidthPixels, mainHeight]);
                        }

                        if (tilesClipRect) {
                            tilesClipRect.attr(dims);
                        }

                        /* other tiles stuff:

                         tilesGroup.attr(attrs);
                         tilesBackground.attr(attrs);
                         datasetBoundsRect.attr("height", tilesHeightPixels);
                         */
                    }

                    function createMain() {
                        // ordering is important - determines z-layout

                        // create main surface
                        main = chart.append("g")
                            .attr("width", mainWidthPixels)
                            .attr("height", mainHeight)
                            .classed("main", true)
                            .translate([margin.left, margin.top]);

                        // zoom behaviour
                        zoom = d3.behavior.zoom()
                            //.scaleExtent([self.minimum, self.maximum])
                            .size([mainWidthPixels, mainHeight])
                            .on("zoomstart", onZoomStart)
                            .on("zoom", onZoom)
                            .on("zoomend", onZoomEnd);
                        zoom(main);

                        zoomSurface = main.append("rect")
                            .attr({
                                width: mainWidthPixels,
                                height: mainHeight,
                                fill: "white",
                                opacity: 1.0
                            })
                            .classed("zoomSurface", true);

                        outOfBoundsRect = main.append("rect")
                            .attr({
                                height: mainHeight,
                                width: mainWidthPixels,
                                x: 0,
                                y: 0
                            })
                            .classed("outOfBounds", true);

                        datasetBoundsRect = main.append("rect")
                            .attr({
                                height: mainHeight,
                                width: mainWidthPixels,
                                x: 0,
                                y: 0
                            })
                            .classed("datasetBounds", true);

                        // rect for showing visualisation extent
                        visualizationBrushArea = main.append("g")
                            .clipPath("url(#" + outerClipId + ")")
                            .classed(clipClass, true)
                            .append("rect")
                            .classed("visualizationBrushArea", true)
                            .attr("height", mainHeight);

                        // group for separator lines between lanes/categories
                        laneLinesGroup = main.append("g").classed("laneLinesGroup", true);


                        // group for rects painted in lanes
                        mainItemsGroup = main.append("g")
                            .clipPath("url(#" + outerClipId + ")")
                            .classed({
                                "mainItemsGroup": true,
                                [clipClass]: true
                            });

                        // elements for painting tiles
                        tilesGroup = main.append("g")
                            .classed("tiles", true);

                        tilesGroup.clipPath("url(#" + tilesGroupClipId + ")");

                        tilesGroup.on("mousedown", onMouseDown);

                        mainMeasure = new MeasureWidget(
                            main.append("g"),
                            {
                                height: measureHeight,
                                width: mainWidthPixels,
                                position: [0, -measureHeight + measureOverLap],
                                text: [
                                    getLowerVisibleDateFormatted,
                                    getVisibleDurationFormatted,
                                    getUpperVisibleDateFormatted,
                                ]
                            }
                        );

                        xAxisSelected = new TimeAxis(main, xScale, {
                            position: [0, getFocusedAxisY()],
                            isVisible: false,
                            orient: "top",
                            customDateFormat: customMultiDateFormat()
                        });

                        focusStem = new FocusStem(
                            main.append("g"),
                            {
                                isVisible: false,
                                position: [xScale(self.focus), 0],
                                text: "Go to",
                                root: xAxisHeight + 2
                            }
                        );

                        yAxisFrequency = d3.svg.axis()
                            .scale(yScaleForTiles)
                            .orient("left")
                            .tickSize(6)
                            .tickPadding(4);
                        yAxisGroup = main.append("g")
                            .classed("y axis frequency", true)
                            .translate([0, 0]);
                        // suppress label rendering initially
                        // squashed axis looks icky
                        //.call(yAxisFrequency);

                        yAxisFrequencyLabel = yAxisGroup.append("text")
                            .text("Frequency (Hz)")
                            .attr({
                                // render off screen initially
                                x: -1000,
                                transform: "rotate(-90)",
                                dy: "1.0em",
                                "text-anchor": "middle",
                                "class": "axis-label"
                            });

                        // rect for showing selected lane (and visualization brush bounds)
                        visualizationBrushLaneOverlay = main.append("g")
                            .clipPath("url(#" + outerClipId + ")")
                            .classed(clipClass, true)
                            .append("rect")
                            .classed("visualizationBrushLaneOverlay", true)
                            .attr("height", getFocusedLaneHeight());

                        xAxis = new TimeAxis(main, xScale, {
                            position: [0, mainHeight],
                            isVisible: false,
                            customDateFormat: customMultiDateFormat()
                        });

                        // group for textual labels, left of the lanes
                        laneLabelsGroup = main.append("g").classed("laneLabelsGroup", true);
                        labels = laneLabelsGroup.selectAll("text");
                        labelBackgrounds = laneLabelsGroup.selectAll("rect");

                    }

                    function updateDataVariables(data) {
                        // public field - share the reference
                        self.items = data.items || [];
                        itemsTree = data.itemsTree;

                        self.lanes = data.lanes || [];
                        self.maximum = data.maximum;
                        self.minimum = data.minimum;
                        self.visualizationYMax = data.visualizationYMax || 0;

                        self.visualizationTileHeight = data.visualizationTileHeight || 100;

                        self.selectedCategory = self.lanes.length === 0 ? 0 : self.lanes[0];
                        self.availableResolutions = data.availableResolutions || [];

                        // ensure resolutions are sorted in ascending order
                        // so they can easily be stuck into a scale
                        self.availableResolutions.sort((a, b) => a - b);

                        isItemsToRender = self.items && self.items.length > 0;
                    }

                    function updateScales() {
                        xScale.domain([self.minimum, self.maximum])
                            .rangeRound([0, mainWidthPixels]);

                        /*
                         // by this point the two methods for calculating visible duration should be equivalent
                         let min = +self.minimum || 0,
                         max = +self.maximum || 0,
                         delta = max - min,
                         visibleFraction = (delta / self.currentZoomValue) / common.msInS;
                         console.assert(
                         Math.abs(visibleFraction - self.visibleDuration) < 0.0001,
                         "My math should be correct!");*/
                    }

                    function updateZoom() {
                        if (self.availableResolutions.length > 0) {
                            zoomLimitSeconds = self.availableResolutions[0] * mainWidthPixels;
                        }

                        // update the zoom behaviour
                        zoom.x(xScale);
                        var zf = getZoomFactors([self.minimum, self.maximum], self.visibleExtent, zoomLimitSeconds);
                        zoom.scaleExtent(zf.scaleExtent);
                        zoom.scale(zf.currentScale);
                        setZoomTranslate(zf.dateTranslate);

                        updatePublicZoomScale();

                        // falsely trigger zoom events to force d3 to re-render with new scale
                        _lockManualZoom = true;
                        zoom.event(main);
                        _lockManualZoom = false;
                    }

                    function updateYScales() {
                        // always have at least one lane, even if no data is available
                        orderedLaneIndexes = d3.range(getLaneLength() || 1);
                        orderedLaneHeights = orderedLaneIndexes.map(x => {
                            return isIndexSelectedLane(x) ? getFocusedLaneHeight() : getLaneHeight();
                        });

                        yRange = orderedLaneHeights.reduce((previous, current, i) => {
                            previous.push(previous[i] + current);
                            return previous;
                        }, [0]);

                        yScale.domain([...orderedLaneIndexes, orderedLaneIndexes[orderedLaneIndexes.length - 1] + 1])
                            .range(yRange);

                        // we draw the tiles within the bounds of
                        // one lane within the main yScale
                        // also need to leave space for the padding and the top (focused) x-axis
                        let lane = self.lanes.indexOf(self.selectedCategory),
                            start = yScale(lane === -1 ? 0 : lane) + lanePaddingTop + focusStemHeight;
                        // inverted y-axis
                        yScaleForTiles.domain([self.visualizationYMax, 0])
                            .range([start, start + getTilesGroupHeight()]);


                        // TODO: pull our y-axis update because yScale never changes for updateExtent
                        // and thus only changes from update data or category selection
                        yAxisFrequency.scale(yScaleForTiles)
                            .tickValues(yScaleForTiles.ticks(10).slice(0, -1).concat([self.visualizationYMax]));
                        yAxisGroup.call(yAxisFrequency);
                        // attributes swapped (and negged) because of rotate transform
                        yAxisFrequencyLabel.attr({
                            y: -laneLabelMarginRight,
                            x: -yScale(self.lanes.indexOf(self.selectedCategory) + 0.5)
                        });

                        TilingFunctions.updateResolutionScaleCeiling(self.availableResolutions, resolutionScale);
                    }


                    function updateMain(dataUpdated) {
                        var lineAttrs = {
                            x1: 0,
                            y1: getSeparatorLineY,
                            x2: mainWidthPixels,
                            y2: getSeparatorLineY,
                            class: "laneLines"
                        };

                        // join and update
                        let lines = laneLinesGroup.selectAll("line")
                            .data(self.lanes)
                            .attr(lineAttrs);

                        // append
                        lines.enter()
                            .append("line")
                            .attr(lineAttrs);

                        // remove
                        lines.exit().remove();

                        // lane labels

                        let labelY = function (d, i) {
                            return yScale(i) + xAxisHeight + lanePaddingTop - axisPadding - fontLineHeight;
                        };

                        // join and update
                        labels = labels.data(self.lanes, d3.id);
                        labelBackgrounds = labelBackgrounds.data(self.lanes, d3.id);

                        if (dataUpdated) {
                            var labelAttrs = {
                                    x: -laneLabelMarginRight,
                                    y: labelY,
                                    dy: fontHeight - (fontLineHeight - fontHeight) / 2,
                                    "text-anchor": "start",
                                    class: "laneText"
                                },
                                labelBackgroundAttrs = {
                                    x: labelAttrs.x,
                                    y: labelY,
                                    width: (d, i) => Math.ceil(labels[0][i].getComputedTextLength()) + 3,
                                    height: fontLineHeight
                                };


                            labels.attr(labelAttrs);
                            labels.selectAll("title")
                                .text(dataFunctions.getCategoryName);
                            labelBackgrounds.attr(labelBackgroundAttrs);

                            labels.enter()
                                .append("text")
                                .text(dataFunctions.getCategoryName)
                                .attr(labelAttrs)
                                .append("title")
                                .text(dataFunctions.getCategoryName);
                            labelBackgrounds.enter()
                                .insert("rect", ":first-child")
                                .attr(labelBackgroundAttrs);

                            labels.exit().remove();
                            labelBackgrounds.exit().remove();
                        } else {
                            // labels only need y changed when only selected category has
                            labels.attr("y", labelY);
                            labelBackgrounds.attr("y", labelY);
                        }
                    }
                    /**
                     * Called when the extent is updated to repaint rects
                     */
                    function renderRects() {

                        // filter out data that is not in range
                        var visibleItems = common
                            .filterAndClusterAudioRecordings(itemsTree, self.visibleExtent);

                        // paint the visible rects
                        // update the visible rects
                        var rects = mainItemsGroup.selectAll("rect")
                            .data(visibleItems, function getKey(d) {
                                return dataFunctions.getId(d);
                            })
                            .attr(rectAttrs);

                        // add new rects
                        rects.enter()
                            .append("rect")
                            .attr(rectAttrs);

                        // remove old rects
                        rects.exit().remove();
                    }

                    function renderAxisAndChrome() {
                        updateVisualizationBrush();

                        // update datasetBounds
                        // effect a manual clip on the range
                        var dbMinimum = Math.max(self.visibleExtent[0], self.minimum);
                        var dbMaximum = Math.min(self.visibleExtent[1], self.maximum);
                        xScale.clamp(true);
                        datasetBoundsRect.attr({
                            x: xScale(dbMinimum) || 0.0,
                            width: Math.max(0, xScale(dbMaximum) - xScale(dbMinimum)) || 0.0
                        });
                        xScale.clamp(false);

                        var domain = xScale.domain(),
                        // intentionally falsey
                            showAxis = domain[1] - domain[0] != 0; // jshint ignore:line

                        xAxisSelected.update(xScale, [0, getFocusedAxisY()], showAxis);
                        xAxis.update(xScale, [0, mainHeight], showAxis);

                        // update measure
                        mainMeasure.updateLabelsText();
                    }

                    function renderFocusGroup() {
                        if (!self.focus) {
                            self.focus = common.middle(xScale.domain());
                        }

                        // reposition
                        let {url, roundedDate} = common.isNavigatable(tilingFunctions, visibleTiles, self.focus);

                        let text = "Go to " +
                            (self.focus ? timeFormatter(roundedDate) : "");

                        focusStem.update(
                            {
                                position: [xScale(self.focus), getFocusedFocusStemY()],
                                text,
                                url,
                                isVisible: true
                            }
                        );
                    }

                    function renderTileElements() {
                        var tileGroupAttrs = {

                                height: self.visualizationTileHeight,

                                /**
                                 * The relative width of the image is a function of the
                                 * the zoom panel's current scale vs the ideal scale of the tile.
                                 */
                                width: d => {
                                    //var imageScale = d.resolution / self.resolution;
                                    //return tileWidthPixels * (imageScale);

                                    // this method (as opposed to multiplicative method above)
                                    // rounds better - it matches the xScale's offset rounding because it uses
                                    // the same internal mechanics
                                    return xScale(d.offsetEnd) - xScale(d.offset);
                                }
                            },
                            imageAttrs = {
                                height: tileGroupAttrs.height,
                                /**
                                 * Disable automatic aspect ratio setting
                                 */
                                preserveAspectRatio: "none",
                                width: tileGroupAttrs.width
                            };


                        const /*debugAttrs = {
                         date: d => d.offset.toString()
                         },*/
                            debugGroupAttrs = {
                                actualResolution: self.resolution.toFixed(4),
                                tileSize: self.tileSizeSeconds.toLocaleString(),
                                tileResolution: () => {
                                    if (visibleTiles.length > 0) {
                                        return visibleTiles[0].resolution;
                                    }
                                },
                                tileResolutionRatio: () => {
                                    if (visibleTiles.length > 0) {
                                        return (visibleTiles[0].resolution / self.resolution).toFixed(4);
                                    }
                                }
                            };

                        let imageCheck = common.imageCheck.bind(null, self.resolution, imageVisibilityThreshold);

                        // debug only
                        tilesGroup.attr(debugGroupAttrs)
                            .translate(getTileGroupTranslation());

                        // create data join
                        var tileElements = tilesGroup.selectAll(".tile")
                            .data(visibleTiles, TilingFunctions.tileKey);

                        // update old tiles
                        tileElements.translate(tilingFunctions.getTileGTranslation)
                            //.attr(debugAttrs)
                            .select("image")
                            .attr({
                                "xlink:href": imageCheck,
                                width: imageAttrs.width
                            });

                        // update dimensions for tile rects
                        tileElements.select("rect")
                            .attr({width: tileGroupAttrs.width});

                        // add new tiles
                        var newTileElements = tileElements.enter()
                            .append("g")
                            //.attr(debugAttrs)
                            .translate(tilingFunctions.getTileGTranslation)
                            .classed("tile", true);

                        // optimize: if we've successfully downloaded a tile before
                        // then we don't need these placeholder tiles
                        var failedOrUnknownTileElements = newTileElements.filter(common.isImageSuccessful);
                        //.data(visibleTiles, tileKey)
                        //.enter();
                        failedOrUnknownTileElements.append("rect")
                            .attr(tileGroupAttrs);

                        // but always add the image element
                        newTileElements.append("image")
                            .attr(imageAttrs)
                            .attr("xlink:href", imageCheck)
                            .on("error", common.imageLoadError, true)
                            .on("load", common.imageLoadSuccess, true)
                            // the following two handlers are for IE compatibility
                            .on("SVGError", common.imageLoadError, true)
                            // the following hack does not work in IE
                            .on("SVGLoad", common.imageLoadSuccess, true);

                        // remove old tiles
                        tileElements.exit().remove();
                    }

                    function updateVisualizationBrush() {
                        var domain = xScale.domain(),
                            middle = common.middle(domain),
                            halfVis = visualizationDuration * common.msInS / 2.0,
                            left = xScale(middle - halfVis),
                            right = xScale(middle + halfVis),
                            width = right - left;
                        //center = left + (width / 2.0);

                        // update the width of the extent marker
                        // correct offset of brush
                        visualizationBrushArea.attr("width", width).translate([left, 0]);

                        // also update the top translation to select a lane
                        var top = yScale(self.lanes.indexOf(self.selectedCategory));
                        visualizationBrushLaneOverlay.attr("width", width).translate([left, top]);
                    }

                    /**
                     * Analogous to touchstart / mousedown.
                     * HOWEVER: touchstart happens before mousedown,
                     * so if it is a touch event, onZoomStart happens significantly before onMouseDown
                     * whereas if it is a mouse event, onMouseDown happens before onZoomStart.
                     * We can use `d3.event.sourceEvent instanceof TouchEvent` to disambiguate.
                     */
                    function onZoomStart() {
                        //console.debug("DistributionDetail:zoomStart:", d3.event.translate, d3.event.scale);

                        // HACK: check whether this event was triggered manually
                        var isManual = _lockManualZoom;

                        if (isManual) {
                            return;
                        }

                        updateFocusDate(false);

                        // update which lane is shown in visualisation
                        var categoryChanged = switchSelectedCategory();

                        // if categoryChanged don't let onMouseDown/onClickNavigate trigger
                        if (categoryChanged) {
                            console.warn("DistributionDetail:zoomStart:preventDefault");
                            d3.event.sourceEvent.preventDefault();
                        }

                        // need the full re-render because of the touchstart event
                        if (categoryChanged) {
                            // updates the public visibleExtent field
                            // and re-renders entire surface
                            updateExtentInternal(xScale.domain(), {
                                dataChanged: false,
                                categoryChanged,
                                zoomChanged: false
                            });

                            // updates the controller - bind back
                            dataFunctions.extentUpdate(self.visibleExtent, "DistributionDetail");
                        }
                        else {
                            //renderFocusGroup();
                        }

                    }

                    function onZoom() {
                        // the xScale is automatically updated
                        // now just re-render everything

                        // HACK: check whether this event was triggered manually
                        var isManual = _lockManualZoom;

                        // debugging, fixed zoom scale at specified resolutoin
                        //zoom.scale([ getZoomFactorForResolution([self.minimum, self.maximum], self.visibleExtent, 60)
                        // ]);

                        //console.debug("DistributionDetail:zoom:Pre", d3.event.translate, d3.event.scale, xScale.domain(),
                        //    zoom.translate(), isManual);

                        // prevent translating off the edge of our data (i.e. clamp the zoom/pan)
                        var domain = null;
                        if (xScale) {
                            zoom.translate(panLimit());
                            domain = xScale.domain();
                        }

                        // if it is a manual event just go back to the middle
                        updateFocusDate(isManual);


                        //mainItemsGroup.translateAndScale(zoom.translate(), [zoom.scale(), 1]);

                        updatePublicZoomScale();

                        //console.debug("DistributionDetail:zoom:Post", d3.event.translate, d3.event.scale, domain,
                        //zoom.translate(), isManual);

                        // don't propagate cyclical events
                        if (isManual) {
                            return;
                        }

                        // update which lane is shown in visualisation
                        let categoryChanged = switchSelectedCategory();

                        // updates the public visibleExtent field
                        // and re-renders entire surface
                        updateExtentInternal(domain, {dataChanged: false, categoryChanged, zoomChanged: false});

                        // updates the controller - bind back
                        dataFunctions.extentUpdate(self.visibleExtent, "DistributionDetail");
                    }

                    function onZoomEnd() {
                        //console.debug("DistributionDetail:zoomEnd:", d3.event.translate, d3.event.scale);

                        if (isItemsToRender) {
                            updatePublicZoomScale();

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
                            halfDomainDuration = (x1 - x0) / 2.0,
                            dataMinimum = +self.minimum,
                            dataMaximum = +self.maximum;

                        // extent allowable pan range by half of the current on-screen visible domain
                        var panExtent0 = dataMinimum - halfDomainDuration,
                            panExtent1 = dataMaximum + halfDomainDuration;

                        if (x0 < panExtent0) {
                            tx = xScale(dataMinimum - (panExtent0 - x0));
                        } else if (x1 > panExtent1) {
                            tx = xScale((panExtent1 - dataMaximum) + x1 - (panExtent1 - panExtent0));
                        } else {
                            tx = zoom.translate()[0];
                        }

                        return [tx, ty];
                    }

                    /**
                     * Does not actually render
                     * @returns {boolean} - true if the category was changed
                     */
                    function switchSelectedCategory() {
                        if (yScale) {
                            //console.debug("DistributionDetail:Category switch");
                            var rounded = 0;
                            if (!_lockManualZoom) {
                                var mouseY = d3.mouse(main.node())[1];
                                var inverted = yScale.invert(mouseY);
                                rounded = Math.floor(inverted);
                            }

                            var newCategory = self.lanes[rounded] || self.selectedCategory;

                            if (newCategory !== self.selectedCategory) {
                                // update public field - this will allow us to switch which
                                // lane is shown based on where an interaction happens on the drawing surface
                                self.selectedCategory = newCategory;

                                return true;
                            }

                            return false;
                        }
                    }

                    /*
                     function getZoomFactorForResolution(fullExtent, visibleExtent, resolution) {
                     var //vl = +visibleExtent[0],
                     //vh = +visibleExtent[1],
                     fullDifference = (+fullExtent[1]) - (+fullExtent[0]);
                     //visibleDifference = vh - vl

                     //var [scaleLower, scaleUpper] = zoom.scaleExtent();

                     var [width] = zoom.size();

                     let desiredDuration = (width * resolution) * common.msInS,
                     scale = fullDifference / desiredDuration;

                     return scale;

                     }*/

                    function getZoomFactors(fullExtent, visibleExtent, limitSeconds) {
                        var vl = +visibleExtent[0],
                            vh = +visibleExtent[1],
                            fullDifference = (+fullExtent[1]) - (+fullExtent[0]),
                            visibleDifference = vh - vl;
                        var limit = limitSeconds * common.msInS;

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

                        if (scaleUpper === -Infinity) {
                            scaleUpper = Infinity;
                        }

                        if (tx === Infinity || isNaN(tx)) {
                            tx = 0;
                        }

                        if (currentScale === Infinity || currentScale === -Infinity || isNaN(currentScale)) {
                            currentScale = 1;
                        }

                        console.debug("DistributionDetail:getZoomFactors:", scaleLower, scaleUpper, currentScale, new Date(tx).toISOString());

                        return {
                            scaleExtent: [scaleLower, scaleUpper],
                            currentScale: currentScale,
                            dateTranslate: tx
                        };
                    }

                    function updatePublicZoomScale() {
                        let z = zoom.scale();

                        self.currentZoomValue = z === undefined ? 1 : z;
                    }

                    function setZoomTranslate(dateOffset) {
                        zoom.translate([-xScale(dateOffset), 0]);
                    }

                    //function isRectVisible(d) {
                    //    return dataFunctions.getLow(d) < self.visibleExtent[1] &&
                    //        dataFunctions.getHigh(d) > self.visibleExtent[0];
                    //}

                    function getCategoryIndex(d) {
                        return self.lanes.indexOf(dataFunctions.getCategory(d));
                    }

                    function isIndexSelectedLane(i) {
                        return self.lanes[i] === self.selectedCategory;
                    }

                    function getLowerVisibleDateFormatted() {
                        if (self.visibleExtent[0]) {
                            return dateTimeFormatD3(self.visibleExtent[0]);
                        }

                        return "";
                    }

                    function getVisibleDurationFormatted() {
                        if (self.visibleDuration) {
                            return humanizeDuration(
                                self.visibleDuration * common.msInS,
                                {
                                    largest: 2,
                                    round: true
                                });
                        }

                        return "";
                    }

                    function getUpperVisibleDateFormatted() {
                        if (self.visibleExtent[1]) {
                            return dateTimeFormatD3(self.visibleExtent[1]);
                        }

                        return "";
                    }

                    /**
                     *  Gets separator lines between categories
                     * @param d
                     * @param i
                     * @returns {*}
                     */
                    function getSeparatorLineY(d, i) {
                        // shift so there is a bottom line but not a top
                        return yScale(i + 1);
                    }

                    function getTileHeight(d) {
                        var i = getCategoryIndex(d),
                            isSelected = isIndexSelectedLane(i);
                        //yScale(i + 1) - yScale(i)
                        return isSelected ? getTilesGroupHeight() : laneHeight;
                    }

                    function getLaneLength() {
                        return self.lanes && self.lanes.length || 0;
                    }

                    function getFocusedLaneHeight() {
                        return getTilesGroupHeight() + focusStemHeight + lanePadding;
                    }

                    function getLaneHeight() {
                        return laneHeight + lanePadding;
                    }

                    var rectAttrs = {
                        x: function (d) {
                            return xScale(dataFunctions.getLow(d));
                        },
                        width: function (d) {
                            return xScale(dataFunctions.getHigh(d)) - xScale(dataFunctions.getLow(d));
                        },
                        "class": function (d) {
                            return "miniItem" + getCategoryIndex(d);
                        },

                        y: getItemRectY,
                        height: getTileHeight
                    };

                    /**
                     * Get the height for viz tiles or the default lane height
                     *  (sans padding) if tile height not available
                     * @returns {number|*|null}
                     */
                    function getTilesGroupHeight() {
                        return self.visualizationTileHeight || laneHeight;
                    }

                    function getItemRectY(item) {
                        var i = getCategoryIndex(item),
                            isSelected = isIndexSelectedLane(i);

                        return yScale(i) + lanePaddingTop + (isSelected ? focusStemHeight : 0);
                    }

                    function getTileGroupTranslation() {
                        var selectedIndex = self.lanes.indexOf(self.selectedCategory);
                        return [0, yScale(selectedIndex) + lanePaddingTop + focusStemHeight];
                    }

                    function getFocusedAxisY() {
                        return yScale(self.lanes.indexOf(self.selectedCategory)) + focusStemHeight + lanePaddingTop;
                    }

                    function getFocusedFocusStemY() {
                        return yScale(self.lanes.indexOf(self.selectedCategory)) + focusStemHeight + lanePaddingTop;
                    }

                    // function distance(pointA, pointB) {
                    //     return Math.sqrt(
                    //         Math.pow(pointA[0] - pointB[0], 2) +
                    //         Math.pow(pointA[1] - pointB[1], 2)
                    //     );
                    // }

                    function onMouseDown() {
                        console.debug("distributionDetail::onMouseDown:");
                        // HACK: disambiguate between clicks and pans
                        _isZooming = $window.performance.now();
                        _hasMouseMoved = d3.mouse(main.node());

                        updateFocusDate(false);
                        renderFocusGroup();
                    }

                    function updateFocusDate(fromMiddle) {
                        if (fromMiddle) {
                            self.focus = common.middle(self.visibleExtent);
                        }
                        else {
                            // doing this outside of a d3 triggered event will cause an error!
                            // In FF, SVGPoint.x/y cannot be assigned undefined which is what
                            // happens when d3.event is null.
                            let position = d3.mouse(main.node())[0];

                            if (isNaN(position)) {
                                // do not update
                                return;
                            }

                            self.focus = xScale.invert(position);

                            if (self.focus < self.minimum) {
                                self.focus = self.minimum;
                            }

                            if (self.focus > self.maximum) {
                                self.focus = self.maximum;
                            }
                        }
                    }
                };
            }
        ]
    ).
directive(
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
