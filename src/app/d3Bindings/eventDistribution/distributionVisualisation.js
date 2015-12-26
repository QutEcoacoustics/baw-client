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
                        focusGroup = main.select(".focus-group"),
                        focusStem,
                        tilesClipRect,

                        tileSizePixels = 60,
                        tileSizeSeconds = 60 * 60,

                    // default value, overridden almost straight away
                        tilesHeight = 256,
                    // default value, overridden almost straight away
                        tilesWidth = 1440,
                    // 86400 seconds
                        oneDay = 60 * 60 * 24,

                    // seconds per pixel
                        resolution = updateResolution(),

                        clipId = "distributionVisualization_" + uniqueId,
                        xScale = d3.time.scale(),
                        yScale = d3.scale.linear(),
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
                        self.middle = newMiddle;
                        self.category = category;

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
                    }

                    /* internal functions*/

                    function create() {

                        // note this depends on the inputs being updated by reference
                        // or remaining constant
                        tilingFunctions = new TilingFunctions(dataFunctions, yScale, xScale, tileCache, d3.scale.identity(), tileSizePixels, false);

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
                        var tileCount = tilingFunctions.getTileCountForWidthRounded(tilesWidth, tileSizePixels);
                        tilesWidth = tileCount * tileSizePixels;
                        self.visibleDuration = tileCount * tileSizeSeconds;

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

                        // update the controller with the visible tilesWidth
                        dataFunctions.visualisationDurationUpdate(self.visibleDuration);
                    }

                    function updateScales() {
                        // calculate then end date for the domain
                        var halfVisibleDuration = self.visibleDuration / 2.0;
                        visibleExtent[0] = d3.time.second.offset(self.middle, -halfVisibleDuration);
                        visibleExtent[1] = d3.time.second.offset(self.middle, halfVisibleDuration);

                        xScale.domain(visibleExtent)
                            .range([0, tilesWidth]);

                        // inverted y-axis
                        yScale.domain([self.visualizationYMax, 0])
                            .range([0, tilesHeight]);
                    }

                    function createElements() {
                        //svg.node().addEventListener("SVGLoad", () => console.log("Main SVG Load completed"));

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

                        tilesGroup.clipPath("url(#" + clipId + ")");

                        tilesGroup.on("click", (source) => common.navigateTo(tilingFunctions, visibleTiles, xScale, source));

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
                        var imageAttrs = {
                            height: tilesHeight,
                            width: tileSizePixels
                        };

                        // reposition
                        let {url, roundedDate} = common.isNavigatable(tilingFunctions, visibleTiles, self.middle);

                        let text = "Go to " +
                            (self.middle ? timeFormatter(roundedDate) : "");

                        focusStem.update(
                            {
                                position: [xScale(self.middle), 0],
                                text,
                                url,
                                isVisible: true
                            }
                        );

                        // create data join
                        var tileElements = tilesGroup.selectAll(".tile")
                            .data(visibleTiles, TilingFunctions.tileKey);

                        let imageCheck = common.imageCheck.bind(null, self.resolution, 0);

                        // update old tiles
                        tileElements.translate(tilingFunctions.getTileGTranslation)
                            .select("image")
                            .attr("xlink:href", imageCheck);

                        // add new tiles
                        var newTileElements = tileElements.enter()
                            .append("g")
                            .translate(tilingFunctions.getTileGTranslation)
                            .classed("tile", true);

                        // optimize: if we've successfully downloaded a tile before
                        // then we don't need these placeholder tiles
                        var failedOrUnknownTileElements = newTileElements.filter(common.isImageSuccessful);
                        //.data(visibleTiles, tileKey)
                        //.enter();
                        failedOrUnknownTileElements.append("rect")
                            .attr(imageAttrs)
                            .attr("class", tileDatum => {
                                return "miniItem" + getCategoryIndex(tileDatum.source);
                            });

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

                    /* helper functions */

                    function updateResolution() {
                        resolution = tileSizeSeconds / tileSizePixels;
                        return resolution;
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
