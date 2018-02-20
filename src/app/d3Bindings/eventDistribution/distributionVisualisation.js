/**
 * Created by Anthony.
 *
 * Intended to show the visualisation chosen by the other event distribution controls
 * A large visual surface of SVG elements, controlled by d3
 * It shows a series of tiles
 *
 */
angular
    .module("bawApp.d3.eventDistribution.distributionVisualisation", [])
    .service(
        "DistributionVisualisation",
        [
            "$location",
            "$rootScope",
            "d3",
            "roundDate",
            "conf.constants",
            "customMultiDateFormat",
            "TimeAxis",
            "FocusStem",
            "distributionCommon",
            "distributionTilingFunctions",
            function ($location, $rootScope, d3, roundDate, constants, customMultiDateFormat, TimeAxis, FocusStem,
                      common, TilingFunctions) {
                return function DistributionVisualisation(target, data, dataFunctions, uniqueId) {
                    // variables
                    var self = this,
                        container = d3.select(target),
                        svg = container.select(".imageTrack svg"),
                    //metaTrack = container.select(".metaTrack"),
                        main = container.select(".imageTrack .main"),
                        tilesBackground = main.select(".tilesBackground"),
                        datasetBoundsRect = main.select(".datasetBounds"),
                        tilesGroup = main.select(".tiles"),
                        mainItemsGroup = main.select(".mainItemsGroup"),
                        focusGroup = main.select(".focus-group"),
                        focusStem,
                        tilesClipRect,
                    // seconds per pixel (fixed)
                        resolution = 60.0,
                        tileSizePixels = 180,
                        tileSizeSeconds = tileSizePixels * resolution,

                    // default value, overridden almost straight away
                        tilesHeight = 256,
                    // default value, overridden almost straight away
                        tilesWidth = 1440,
                    // 86400 seconds
                        oneDay = 60 * 60 * 24,

                        clipId = "distributionVisualization_" + uniqueId,
                        xScale = d3.time.scale(),
                        yScale = d3.scale.linear(),
                        drag,
                        xAxis,
                        xAxisHeight = 30,
                        yAxis,
                        yAxisGroup,
                        yAxisWidth = 52,
                        margin = {
                            top: 23,
                            right: 0,
                            left: 5 + yAxisWidth,
                            bottom: 5 + xAxisHeight
                        },

                        // flag for preventing cyclic event loops
                        _lockUpdate = false,
                        visibleExtent = [],
                        visibleTiles = [],
                        tilingFunctions,
                    /*
                     * WeakMap<item, Map<resolution, tiles>>
                     */
                        tileCache = new WeakMap(),
                        itemsTree;


                    const timeFormatter = d3.time.format(constants.localization.timeFormatD3);

                    // exports
                    self.items = [];
                    self.visualizationYMax = 11025;
                    self.visualizationTileHeight = 512;
                    self.visibleDuration = oneDay;
                    self.middle = null;
                    self.category = null;
                    self.updateData = updateData;
                    self.updateMiddle = updateMiddle;

                    // init
                    create();

                    /* exported functions */

                    function updateData(data) {
                        updateDataVariables(data);

                        setDimensions();

                        updateScales();

                        // recalculate what tiles are visible
                        visibleTiles = tilingFunctions.filterTilesRTree(
                            tileSizeSeconds,
                            resolution,
                            itemsTree,
                            visibleExtent,
                            self.category
                        );

                        updateElements();

                        // pulling our y-axis update because yScale never changes for updateMiddle
                        // and thus only changes from update data
                        yAxis.scale(yScale).tickValues(yScale.ticks(10).slice(0, -1).concat([self.visualizationYMax]));
                        yAxisGroup.call(yAxis);
                    }

                    function updateMiddle(newMiddle, category) {
                        if (_lockUpdate) {
                            return;
                        }

                        updateMiddleInternal(newMiddle, category, true);
                    }

                    function updateMiddleInternal(newMiddle, category, shouldStemBeMiddle) {
                        self.middle = newMiddle;
                        self.category = category;

                        updateScales();

                        updateFocusDate(shouldStemBeMiddle);

                        // recalculate what tiles are visible
                        visibleTiles = tilingFunctions.filterTilesRTree(
                            tileSizeSeconds,
                            resolution,
                            itemsTree,
                            visibleExtent,
                            self.category
                        );

                        updateElements();

                    }

                    /* internal functions*/

                    function create() {

                        // note this depends on the inputs being updated by reference
                        // or remaining constant
                        tilingFunctions = new TilingFunctions(dataFunctions, yScale, xScale, tileCache, d3.scale.identity(), tileSizePixels, true);

                        updateDataVariables(data);

                        setDimensions();

                        updateScales();

                        createElements();
                    }

                    function updateDataVariables(data) {
                        // data should be an array of items with extents
                        self.items = data.items;
                        itemsTree = data.itemsTree;

                        self.lanes = new Map();
                        (data.lanes || []).forEach((item, index) => self.lanes.set(item, index));

                        self.maximum = data.maximum;
                        self.minimum = data.minimum;
                        self.visualizationYMax = data.visualizationYMax;
                        self.visualizationTileHeight = data.visualizationTileHeight;
                        self.middle = null;
                    }

                    function setDimensions() {
                        tilesWidth = common.getWidth(container, margin);

                        // want tilesHeight to be a function of nyquistRate and window
                        var newHeight = getTilesGroupHeight();
                        if (newHeight >= 0) {
                            tilesHeight = newHeight;
                        }
                        var svgHeight = tilesHeight + margin.top + margin.bottom;
                        svg.style("height", svgHeight + "px");

                        var attrs = {
                            width: tilesWidth,
                            height: tilesHeight
                        };
                        tilesGroup.attr(attrs);
                        tilesBackground.attr(attrs);
                        datasetBoundsRect.attr("height", tilesHeight);
                        if (tilesClipRect) {
                            tilesClipRect.attr(attrs);
                        }

                        updateVisibleDuration();
                    }


                    function updateVisibleDuration() {
                        var result = 0.0;
                        // we should really use the xScale here, but this value detmines the
                        // xScale, thus is recursive.
                        result = tilesWidth * resolution;
                        self.visibleDuration = result;

                        // update the controller with the visible tilesWidth
                        dataFunctions.visualisationDurationUpdate(result);
                    }



                    function updateScales() {
                        updateVisibleDuration();

                        // calculate then end date for the domain
                        var halfVisibleDuration = self.visibleDuration / 2.0;
                        visibleExtent[0] = d3.time.second.offset(self.middle, -halfVisibleDuration);
                        visibleExtent[1] = d3.time.second.offset(self.middle, halfVisibleDuration);

                        xScale.domain(visibleExtent)
                            .rangeRound([0, tilesWidth]);

                        // inverted y-axis
                        yScale.domain([self.visualizationYMax, 0])
                            .range([0, tilesHeight]);
                    }

                    function createElements() {
                        // this example has an associated html template...
                        // most of the creation is not necessary

                        tilesClipRect = svg.append("defs")
                            .append("clipPath")
                            .attr("id", clipId)
                            .append("rect")
                            .attr({
                                width: tilesWidth,
                                height: tilesHeight
                            });

                        main.translate([margin.left, margin.top]);

                        // interactive pan behaviour
                        drag = d3.behavior.drag().on("drag", onDrag);
                        main.call(drag);
                        main.on("mousedown", onMouseDown);

                        tilesGroup.clipPath("url(#" + clipId + ")");
                        mainItemsGroup.clipPath("url(#" + clipId + ")");

                        // Navigate to listen page on single click (we don't want this enabled, bad UI)
                        // tilesGroup.on(
                        //     "click",
                        //     (source) => common.navigateTo(tilingFunctions, visibleTiles, xScale, tilesGroup));

                        xAxis = new TimeAxis(main, xScale, {
                            position: [0, tilesHeight], isVisible: false,
                            customDateFormat: customMultiDateFormat()
                        });
                        yAxis = d3.svg.axis()
                            .scale(yScale)
                            .orient("left")
                            .tickSize(6)
                            .tickPadding(8);
                        yAxisGroup = main.append("g")
                            .classed("y axis", true)
                            .translate([0, 0])
                            .call(yAxis);

                        focusStem = new FocusStem(
                            focusGroup,
                            {
                                isVisible: false,
                                position: [xScale(self.middle), 0],
                                text: "Go to"
                            }
                        );

                        updateElements();
                    }


                    function updateElements() {
                        // var imageAttrs = {
                        //     height: tilesHeight,
                        //     width: tileSizePixels
                        // };

                        renderFocusGroup();

                        // render the color surface
                        renderRects();

                        // render them image
                        renderTileElements();

                        // update datasetBounds
                        // effect a manual clip on the range
                        var dbMinimum = Math.max(visibleExtent[0], self.minimum);
                        var dbMaximum = Math.min(visibleExtent[1], self.maximum);
                        xScale.clamp(true);
                        datasetBoundsRect.attr({
                            x: xScale(dbMinimum) || 0.0,
                            width: Math.max(0, xScale(dbMaximum) - xScale(dbMinimum)) || 0.0
                        });
                        xScale.clamp(false);

                        var domain = xScale.domain(),
                        // intentionally falsey
                            showAxis = domain[1] - domain[0] != 0; // jshint ignore:line

                        xAxis.update(xScale, [0, tilesHeight], showAxis);
                    }

                    /**
                     * Called when the extent is updated to repaint rects
                     */
                    function renderRects() {
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

                            y: 0,
                            height: tilesHeight
                        };


                        // filter out data that is not in range
                        var visibleItems = common
                            .filterAndClusterAudioRecordings(itemsTree, xScale.domain())
                            .filter(d => dataFunctions.getCategory(d) === self.category);

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


                        let imageCheck = common.imageCheck.bind(null, () => self.resolution, 0);

                        // debug only
                        //tilesGroup.attr(debugGroupAttrs);
                            //.translate(getTileGroupTranslation());

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
                            .attr({
                                width: tileGroupAttrs.width
                            });

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

                    function renderFocusGroup() {
                        if (!self.focus) {
                            self.focus = common.middle(xScale.domain());
                        }

                        // reposition
                        let {url, roundedDate} = common.isNavigatable(tilingFunctions, visibleTiles, self.focus);

                        let text = "Go to " +
                            (self.focus ? timeFormatter(roundedDate) : "");

                        focusStem.update({
                            position: [xScale(self.focus), 0],
                            text,
                            url,
                            isVisible: true
                        });
                    }

                    /* helper functions */

                    function onMouseDown() {
                        console.debug("distributionVisualisation::onMouseDown:");
                        // HACK: disambiguate between clicks and pans
                        //_isZooming = $window.performance.now();
                        //_hasMouseMoved = d3.mouse(main.node());

                        updateFocusDate(false);
                        renderFocusGroup();
                    }
                    
                    function onDrag() {
                        if (d3.event) {
                            let dx = d3.event.dx;

                            if (isNaN(dx)) {
                                // do not update
                                return;
                            }

                            let newMiddle = xScale.invert(xScale(self.middle) - dx);

                            if (newMiddle < self.minimum) {
                                newMiddle = self.minimum;
                            }

                            if (newMiddle > self.maximum) {
                                newMiddle = self.maximum;
                            }

                            console.debug("distributionVisualisation::Drag:", dx, +newMiddle);
                            
                            // internal update
                            _lockUpdate = true;
                            updateMiddleInternal(newMiddle, self.category, false);

                            // updates the controller - bind back
                            // the xScale's domain is updated by updateMiddle
                            dataFunctions.extentUpdate(xScale.domain(), "DistributionVisualisation");
                            _lockUpdate = false;
                        }

                    }

                    function updateFocusDate(fromMiddle) {
                        if (fromMiddle) {
                            self.focus = common.middle(xScale.domain());
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

                    function getTilesGroupHeight() {
                        return self.visualizationTileHeight || 0;
                    }

                    function getCategoryIndex(d) {
                        return self.lanes.get(dataFunctions.getCategory(d));
                    }
                };
            }
        ]
    ).directive(
    "eventDistributionVisualisation",
    [
        "conf.paths",
        "DistributionVisualisation",
        function (paths, DistributionVisualisation) {
            // directive definition object
            return {
                restrict: "EA",
                scope: false,
                require: "^^eventDistribution",
                templateUrl: paths.site.files.d3Bindings.eventDistribution.distributionVisualisation,
                link: function ($scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];
                    controller.visualisation.push(new DistributionVisualisation(
                        element,
                        controller.data,
                        controller.options.functions,
                        $scope.$id));
                }
            };
        }
    ]
);
