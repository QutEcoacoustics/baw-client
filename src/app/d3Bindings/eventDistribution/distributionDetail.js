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
            "d3",
            "TimeAxis",
            "distributionCommon",
            "distributionTilingFunctions",
            function ($window, $timeout, d3, TimeAxis, common, TilingFunctions) {
                return function DistributionDetail(target, data, dataFunctions, uniqueId) {
                    var self = this,
                        container = d3.select(target),
                        isItemsToRender,
                        chart,
                        main,
                        mainClipRect,
                        clipClass = "clippedToVisibleBounds",
                        outerClipId = "distributionDetail_" + uniqueId,
                        xAxis,
                        /**
                         * The 'top' x axis for the currently selected lane.
                         */
                        xAxisSelected,
                        yAxisFrequency,
                        yAxisGroup,
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
                        _navigateTimeoutPromise = null,
                        laneLinesGroup,
                        laneLabelsGroup,
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
                        mainHeight = 0,

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
                        axisPadding = 14,
                        fontLineHeight = 17,
                        fontHeight = 14,
                        lanePaddingTop = 5,
                        lanePaddingBottom = 5,
                        lanePadding = lanePaddingTop + lanePaddingBottom,
                        laneHeight = 30,
                        xAxisHeight = 26,
                        yAxisWidth = 55,
                        margin = {
                            top: 5,
                            right: 5,
                            bottom: 5 + xAxisHeight,
                            left: yAxisWidth + 5
                        },
                        laneLabelMarginRight = margin.left,

                        /**
                         * A cache of tiles generated from items.
                         * @type {WeakMap<item, Map<resolution, Array<tiles>>>}
                         */
                        tileCache = new WeakMap(),
                        clickOrDblTimeoutMilliseconds = 300,
                        clickOrDragThresholdPixels = 1;

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

                         focusLine.attr("height", tilesHeightPixels + focusStemPath.root);
                         focusTextGroup.translate(() => [0, -(focusStemPath.root + focusStemPath.stems)]);
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
                        tilesGroup.on("click", onClickNavigate);
                        tilesGroup.on("dblclick", onDblClick);


                        xAxisSelected = new TimeAxis(
                            main, xScale, {
                                position: [0, getFocusedAxisY()],
                                isVisible: false,
                                orient: "top"
                            });
                        yAxisFrequency = d3.svg.axis()
                            .scale(yScaleForTiles)
                            .orient("left")
                            .tickSize(6)
                            .tickPadding(8);
                        yAxisGroup = main.append("g")
                            .classed("y axis", true)
                            .translate([0, 0])
                            .call(yAxisFrequency);

                        // rect for showing selected lane (and visualization brush bounds)
                        visualizationBrushLaneOverlay = main.append("g")
                            .clipPath("url(#" + outerClipId + ")")
                            .classed(clipClass, true)
                            .append("rect")
                            .classed("visualizationBrushLaneOverlay", true)
                            .attr("height", getFocusedLaneHeight());

                        xAxis = new TimeAxis(main, xScale, {position: [0, mainHeight], isVisible: false});

                        // group for textual labels, left of the lanes
                        laneLabelsGroup = main.append("g").classed("laneLabelsGroup", true);

                    }

                    function updateDataVariables(data) {
                        // public field - share the reference
                        self.items = data.items || [];
                        itemsTree = data.itemsTree;

                        self.lanes = data.lanes || [];
                        self.maximum = data.maximum;
                        self.minimum = data.minimum;
                        self.visualizationYMax = data.visualizationYMax || 0;

                        self.visualizationTileHeight = data.visualizationTileHeight || 0;

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
                            start = yScale(lane === -1 ? 0 : lane) + lanePaddingTop + xAxisHeight;
                        // inverted y-axis
                        yScaleForTiles.domain([self.visualizationYMax, 0])
                            .range([start, start + getTilesGroupHeight()]);


                        // TODO: pull our y-axis update because yScale never changes for updateExtent
                        // and thus only changes from update data or category selection
                        yAxisFrequency.scale(yScaleForTiles).tickValues(yScaleForTiles.ticks(10).slice(0, -1).concat([self.visualizationYMax]));
                        yAxisGroup.call(yAxisFrequency);

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
                        let labels = laneLabelsGroup.selectAll("text").data(self.lanes),
                            labelBackgrounds = laneLabelsGroup.selectAll("rect").data(self.lanes);

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
                                    width: (d, i) => Math.ceil(labels[0][i].getComputedTextLength()) + 1,
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
                     * Filter out audio recordings.
                     * Additionally cluster audio recordings together into contiguous blocks
                     * to reduce the number of elements on the screen.
                     * @returns {Array.<T>}
                     */
                    function filterAndClusterAudioRecordings() {
                        // get the duration (in real time) equivalent to 1px
                        //let visibleTime = xScale.invert(1);

                        let filtered = itemsTree.search([
                            self.visibleExtent[0],
                            -Infinity,
                            self.visibleExtent[1],
                            +Infinity
                        ]);


                        // TODO: actually implement clustering
                        // pre: split items into lane groups
                        // pre: sort data in each group by start time
                        // loop over each group
                        //     start a new group
                        //     loop over all items
                        //         if next item's start - this item's end < visibleTime
                        //            add to group
                        //         else
                        //            start a new group


                        return filtered;
                    }

                    /**
                     * Called when the extent is updated to repaint rects
                     */
                    function renderRects() {

                        // filter out data that is not in range
                        var visibleItems = filterAndClusterAudioRecordings();

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
                    }

                    function renderFocusGroup() {
                        // reposition
                        /*
                         focusGroup.translate(() => [xScale(self.middle), 0]);
                         let {url, roundedDate} = isNavigatable(self.middle);
                         focusText.text(() => {
                         if (self.middle) {
                         return "Go to " + timeFormatter(roundedDate);
                         }

                         return "";
                         });
                         focusAnchor.attr("xlink:href", url);
                         focusAnchor.classed("disabled", !url);
                         // this IS MEGA bad for performance - forcing a layout
                         //focusStem.attr("d", getFocusStemPath(focusText.node().getComputedTextLength()));
                         focusStem.attr("d", getFocusStemPath());*/
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


                        const debugAttrs = {
                                date: d => d.offset.toString(),
                                tileResolution: d => d.resolution,
                                tileResolutionRatio: d => (d.resolution / self.resolution).toFixed(4)
                            },
                            debugGroupAttrs = {
                                actualResolution: self.resolution.toFixed(4),
                                tileSize: self.tileSizeSeconds.toLocaleString()
                            };


                        // debug only
                        tilesGroup.attr(debugGroupAttrs)
                            .translate(getTileGroupTranslation());

                        // create data join
                        var tileElements = tilesGroup.selectAll(".tile")
                            .data(visibleTiles, TilingFunctions.tileKey);

                        // update old tiles
                        tileElements.translate(tilingFunctions.getTileGTranslation)
                            .attr(debugAttrs)
                            .select("image")
                            .attr({
                                "xlink:href": common.imageCheck,
                                width: imageAttrs.width
                            });

                        // update dimensions for tile rects
                        tileElements.select("rect")
                            .attr({width: tileGroupAttrs.width});

                        // add new tiles
                        var newTileElements = tileElements.enter()
                            .append("g")
                            .attr(debugAttrs)
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
                            .attr("xlink:href", common.imageCheck)
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

                        // prevent translating off the edge of our data (i.e. clamp the zoom/pan)
                        var domain = null;
                        if (xScale) {
                            zoom.translate(panLimit());
                            domain = xScale.domain();
                        }

                        //mainItemsGroup.translateAndScale(zoom.translate(), [zoom.scale(), 1]);

                        updatePublicZoomScale();

                        //console.debug("DistributionDetail:zoom:", d3.event.translate, d3.event.scale, domain,
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

                    /**
                     *
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
                                //updateVisualizationBrush();
                                //updateYScales();
                                //updateMain();

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

                    /**
                     *  Gets separator lines between categories
                     * @param d
                     * @param i
                     * @returns {*}
                     */
                    function getSeparatorLineY(d, i) {
                        return yScale(i);
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
                        return getTilesGroupHeight() + xAxisHeight + lanePadding;
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

                        return yScale(i) + lanePaddingTop + (isSelected ? xAxisHeight : 0);
                    }

                    function getTileGroupTranslation() {
                        var selectedIndex = self.lanes.indexOf(self.selectedCategory);
                        return [0, yScale(selectedIndex) + lanePaddingTop + xAxisHeight];
                    }

                    function getFocusedAxisY() {
                        return yScale(self.lanes.indexOf(self.selectedCategory)) + xAxisHeight + lanePaddingTop;
                    }

                    function distance(pointA, pointB) {
                        return Math.sqrt(
                            Math.pow(pointA[0] - pointB[0], 2) +
                            Math.pow(pointA[1] - pointB[1], 2)
                        );
                    }

                    function onMouseDown() {
                        console.debug("distributionDetail::onMouseDown:");
                        // HACK: disambiguate between clicks and pans
                        _isZooming = $window.performance.now();
                        _hasMouseMoved = d3.mouse(main.node());
                    }

                    function onClickNavigate() {
                        let now = $window.performance.now(),
                            deltaTime = now - _isZooming,
                            newPosition = d3.mouse(main.node()),
                            deltaPosition = distance(newPosition, _hasMouseMoved);

                        console.debug("distributionDetail::onClickNavigate: deltaTime, deltaPosition:", deltaTime, deltaPosition);

                        // if the mouse hasn't moved
                        if (deltaPosition < clickOrDragThresholdPixels) {
                            console.debug("distributionDetail::onClickNavigate: **click** NOT drag", $window.performance.now());

                            // and if we're not already tracking another click in a series for a double click
                            if (!_navigateTimeoutPromise) {
                                console.warn("distributionDetail::onClickNavigate::beforeTimeout:", $window.performance.now());
                                // delay navigate for a set amount of time...
                                // give the double click event handler time to cancel the navigate
                                _navigateTimeoutPromise = $timeout(
                                    //() => console.debug("distributionDetail::onClickNavigate::timeoutComplete:",
                                    // $window.performance.now()),
                                    () => {
                                        // only navigate if the timeout was successful
                                        console.warn("distributionDetail::onClickNavigate::timeoutResolved: Navigating now!", $window.performance.now());
                                        //common.navigateTo(tilingFunctions, visibleTiles, xScale, tilesGroup);
                                    },
                                    clickOrDblTimeoutMilliseconds);

                                // make sure we keep original reference to $timeout promise (i.e. don't chain the then)
                                _navigateTimeoutPromise.finally(() => {
                                    // this may not matter if we're navigating away,
                                    // but cleaning up state is responsible
                                    _navigateTimeoutPromise = null;
                                });
                            }
                        }

                        _isZooming = null;
                        _hasMouseMoved = null;
                    }

                    /**
                     * This handler exists solely to cancel navigation on a single click
                     * if it in fact turns out to be a double click.
                     */
                    function onDblClick() {
                        console.debug("distributionDetail::onDblClick: Cancelling navigate");

                        // cancel the navigate from a single click
                        $timeout.cancel(_navigateTimeoutPromise);
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
