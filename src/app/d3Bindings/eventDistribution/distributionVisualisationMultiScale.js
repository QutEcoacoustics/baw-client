/**
 * Created by Anthony.
 *
 * Intended to show the visualisation chosen by the other event distribution controls
 * A large visual surface of SVG elements, controlled by d3
 * It shows a series of tiles
 *
 */
angular
    .module("bawApp.d3.eventDistribution.distributionVisualisationMultiScale", [])
    .service(
        "DistributionVisualisationMultiScale",
        [
            "$location",
            "$rootScope",
            "d3",
            "roundDate",
            "TimeAxis",
            "distributionCommon",
            function ($location, $rootScope, d3, roundDate, TimeAxis, common) {
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
                        focusGroup = main.select(".focusGroup"),
                        focusTextGroup = focusGroup.select(".focusTextGroup"),
                        focusLine = focusGroup.select(".focusLine"),
                        focusStem = focusGroup.select(".focusStem"),
                        focusAnchor = focusGroup.select(".focusAnchor"),
                        focusText = focusGroup.select(".focusText"),
                        focusStemPath = {
                            width: 91,
                            stems: 4,
                            root: 8
                        },
                        tilesClipRect,

                        tileWidthPixels = 180,
                        tileCount = 0,
                    // default value, overridden almost straight away
                        tilesHeightPixels = 256,
                    // default value, overridden almost straight away
                        tilesTotalWidthPixels = 1440,
                    // 86400 seconds
                    //oneDay = 60 * 60 * 24,
                    // round to nearest 30 seconds for navigation urls
                        navigationOffsetRounding = 30,


                        clipId = "distributionVisualizationMultiScale_" + uniqueId,
                        xScale,
                        yScale,
                    // used to map actual zoom scale values to tiles of the appropriate resolution
                        resolutionScale,
                        xAxis,
                        xAxisHeight = 30,
                        yAxis,
                        yAxisGroup,
                        yAxisWidth = 52,
                        margin = {
                            top: 23,
                            right: 0,
                            left: 68 + yAxisWidth,
                            bottom: 0 + xAxisHeight
                        },

                        visibleExtent = [],
                        visibleTiles = [],
                        failedImages = new Set(),
                        successfulImages = new Set(),
                    /*
                     * WeakMap<item, Map<resolution, tiles>>
                     */
                        tileCache = new WeakMap();

                    const timeFormatter = d3.time.format("%H:%M:%S"),
                        msInS = 1e3;

                    // exports
                    self.items = [];
                    self.visualizationYMax = 11025;
                    self.visualizationTileHeight = 512;
                    self.visibleDuration = null;
                    self.middle = null;
                    self.category = null;
                    self.updateData = updateData;
                    self.updateMiddle = updateMiddle;
                    self.tileSizeSeconds = null;
                    // seconds per pixel
                    self.resolution = null;
                    self.currentZoomValue = 1;
                    self.availableResolutions = [];

                    // init
                    create();

                    /* exported functions */

                    function updateData(data) {
                        updateDataVariables(data);

                        setDimensions();

                        updateScales();

                        visibleTiles = filterTiles(visibleExtent, self.category);

                        updateElements();

                        // pulling our y-axis update because yScale never changes for updateMiddle
                        // and thus only changes from update data
                        yAxis.scale(yScale).tickValues(yScale.ticks(10).slice(0, -1).concat([self.visualizationYMax]));
                        yAxisGroup.call(yAxis);
                    }

                    function updateMiddle(newMiddle, category, currentZoomValue) {
                        self.middle = newMiddle;
                        self.category = category;
                        self.currentZoomValue = currentZoomValue;

                        updateScales();

                        visibleTiles = filterTiles(visibleExtent, self.category);

                        updateElements();
                    }

                    /* internal functions*/

                    function create() {
                        updateDataVariables(data);

                        setDimensions();

                        updateScales();

                        createElements();
                    }

                    function updateDataVariables(data) {
                        // data should be an array of items with extents
                        self.items = data.items;
                        self.maximum = data.maximum;
                        self.minimum = data.minimum;
                        self.visualizationYMax = data.visualizationYMax;
                        self.visualizationTileHeight = data.visualizationTileHeight;
                        self.middle = null;
                        self.currentZoomValue = 1;
                        self.availableResolutions = data.availableResolutions || [];
                        self.availableResolutions.sort((a, b) => a - b);
                    }

                    function setDimensions() {
                        let widths = getWidth();
                        tilesTotalWidthPixels = widths.width;
                        tileCount = widths.tileCount;


                        // want tilesHeightPixels to be a function of visualizationYMax and window
                        var newHeight = getTilesGroupHeight();
                        if (newHeight >= 0) {
                            tilesHeightPixels = newHeight;
                        }
                        var svgHeight = tilesHeightPixels + margin.top + margin.bottom;
                        svg.style("height", svgHeight + "px");

                        var attrs = {
                            width: tilesTotalWidthPixels,
                            height: tilesHeightPixels
                        };
                        tilesGroup.attr(attrs);
                        tilesBackground.attr(attrs);
                        datasetBoundsRect.attr("height", tilesHeightPixels);
                        if (tilesClipRect) {
                            tilesClipRect.attr(attrs);
                        }

                        focusLine.attr("height", tilesHeightPixels + focusStemPath.root);
                        focusTextGroup.translate(() => [0, -(focusStemPath.root + focusStemPath.stems)]);
                    }

                    function updateScales() {
                        let min = +self.minimum || 0,
                            max = +self.maximum || 0,
                            delta = max - min,
                            visibleFraction = delta / self.currentZoomValue;
                        // finally, convert to seconds
                        self.visibleDuration = visibleFraction / msInS;
                        // TODO: snap tile domain to zoom levels that are available
                        self.tileSizeSeconds = self.visibleDuration / tileCount;
                        self.resolution = self.tileSizeSeconds / tileWidthPixels;


                        // update the controller with the visible tilesTotalWidthPixels
                        // NOTE: this control does not need to do this because it uses the same width as the detail control!
                        //dataFunctions.visualisationDurationUpdate(self.visibleDuration);
                        // calculate then end date for the domain
                        var halfVisibleDuration = self.visibleDuration / 2.0;
                        visibleExtent[0] = d3.time.second.offset(self.middle, -halfVisibleDuration);
                        visibleExtent[1] = d3.time.second.offset(self.middle, halfVisibleDuration);

                        xScale = d3.time.scale()
                            .domain(visibleExtent)
                            .range([0, tilesTotalWidthPixels]);

                        yScale = d3.scale.linear()
                            // inverted y-axis
                            .domain([self.visualizationYMax, 0])
                            .range([0, tilesHeightPixels]);


                        resolutionScale = d3.scale.threshold()
                            .domain(self.availableResolutions)
                            .range([
                                0,
                                //self.availableResolutions[0] || 0,
                                ...self.availableResolutions
                                //(self.availableResolutions.slice(-1) || [1])[0]
                            ]);
                    }

                    function filterTiles(visibleExtent, category) {
                        var filterPaddingMs = self.tileSizeSeconds * msInS;
                        // item filter
                        // pad the filtering extent with tileSize so that recordings that have
                        // duration < tileSize aren't filtered out prematurely
                        var fExtent = [(+visibleExtent[0]) - filterPaddingMs, (+visibleExtent[1]) + filterPaddingMs],
                            f = common.isItemVisible.bind(null, dataFunctions.getLow, dataFunctions.getHigh, fExtent),
                            g = common.isInCategory.bind(null, dataFunctions.getCategory, category),
                            h = common.and.bind(null, g, f);

                        // tile filter
                        var l = common.isTileVisible.bind(null, visibleExtent);

                        return self.items
                            .filter(h)
                            .reduce(function (previous, current) {
                                let selectedResolution = resolutionScale(self.resolution),
                                    tiles = generateTiles(current, selectedResolution);

                                let filteredTiles = tiles.filter(l);
                                return previous.concat(filteredTiles);
                            }, [])
                            .sort(common.sortTiles);
                    }

                    /**
                     * Generate the tiles - but do not eagerly cache!
                     * Also do not store tiles on item.
                     * Too many tiles.
                     */
                    function generateTiles(item, resolution) {
                        // the tile cache is a WeakMap of Maps
                        // tileCache: WeakMap<item, Map<resolution, tiles>>

                        // get resolution map
                        let resolutionCache = tileCache.get(item);

                        if (resolutionCache) {
                            // get tiles
                            let cachedTiles = resolutionCache.get(resolution);

                            if (cachedTiles) {
                                return cachedTiles;
                            }
                        }
                        else {
                            // create a new holder
                            resolutionCache = new Map();
                            tileCache.set(item, resolutionCache);
                        }

                        let tiles = splitIntoTiles(item, resolution);
                        resolutionCache.set(resolution, tiles);

                        return tiles;
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
                                width: tilesTotalWidthPixels,
                                height: tilesHeightPixels
                            });

                        main.translate([margin.left, margin.top]);

                        tilesGroup.clipPath("url(#" + clipId + ")");

                        tilesGroup.on("click", navigateTo);

                        xAxis = new TimeAxis(main, xScale, {position: [0, tilesHeightPixels], isVisible: false});
                        yAxis = d3.svg.axis()
                            .scale(yScale)
                            .orient("left")
                            .tickSize(6)
                            .tickPadding(8);
                        yAxisGroup = main.append("g")
                            .classed("y axis", true)
                            .translate([0, 0])
                            .call(yAxis);

                        updateElements();
                    }

                    //<editor-fold desc="Description">
                    function tileGTranslation(d, i) {
                        return [getTileLeft(d, i), 0];
                    }

                    function checkImage(d) {
                        // check if the image has been successfully downloaded before
                        // if it has not, do not set
                        // if it has, then set
                        // otherwise, set for first time and try!
                        if (failedImages.has(d.tileImageUrl)) {
                            return null;
                        } else {
                            return d.tileImageUrl;
                        }
                    }

                    function imageLoadError(d, index) {
                        //console.error("SVG image error", arguments);
                        var target = d3.select(d3.event.target);

                        // remove the href from the image
                        target.attr("xlink:href", null);

                        // record failure so we don't try and DL image again
                        failedImages.add(d.tileImageUrl);
                    }

                    function imageLoadSuccess(d) {
                        //console.info("SVG image success", arguments);
                        if (successfulImages.has(d.tileImageUrl)) {
                            return;
                        }

                        // if successful, remove text (and let bg color through)
                        var target = d3.event.target,
                            siblings = target.parentNode.childNodes;

                        Array.from(siblings).forEach(function (node, index) {
                            if (!(node instanceof SVGImageElement)) {
                                node.remove();
                            }
                        });

                        // record success so we can optimise tile creation in the future
                        successfulImages.add(d.tileImageUrl);
                    }

                    function tileKey(d) {
                        return d.key;
                    }

                    //</editor-fold>

                    function updateElements() {
                        var rectAttrs = {
                                height: tilesHeightPixels,

                                /**
                                 * The relative width of the image is a function of the
                                 * the zoom panel's current scale vs the ideal scale of the tile.
                                 */
                                width: d => {
                                    var imageScale = d.resolution / self.resolution;
                                    //console.debug("DistributionVisualisation:updateElements:width: current image ratio:", imageScale, d.resolution, self.resolution);
                                    return tileWidthPixels * (imageScale);
                                }
                            },
                            imageAttrs = {
                                height: rectAttrs.height,
                                /**
                                 * Disable automatic aspect ratio setting
                                 */
                                preserveAspectRatio: "none",
                                width: rectAttrs.width
                            };


                        const debugAttrs = {
                                date: getOffsetDate,
                                time: getOffsetTime,
                                tileResolution: d => d.resolution,
                                tileResolutionRatio: d => (d.resolution / self.resolution).toFixed(4)
                            },
                            debugGroupAttrs = {
                                actualResolution: self.resolution.toFixed(4),
                                tileSize: self.tileSizeSeconds.toLocaleString()
                            };

                        // reposition
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
                        focusStem.attr("d", getFocusStemPath());

                        // debug only
                        tilesGroup.attr(debugGroupAttrs);

                        // create data join
                        var tileElements = tilesGroup.selectAll(".tile")
                            .data(visibleTiles, tileKey);

                        // update old tiles
                        tileElements.translate(tileGTranslation)
                            .attr(debugAttrs)
                            .select("image")
                            .attr({
                                "xlink:href": checkImage,
                                width: imageAttrs.width
                            });

                        // update dimensions for tile rects
                        tileElements.select("rect")
                            .attr({width: rectAttrs.width});

                        // add new tiles
                        var newTileElements = tileElements.enter()
                            .append("g")
                            .attr(debugAttrs)
                            .translate(tileGTranslation)
                            .classed("tile", true);

                        // optimize: if we've successfully downloaded a tile before
                        // then we don't need these placeholder tiles
                        var failedOrUnknownTileElements =
                            newTileElements.filter(d => !successfulImages.has(d.tileImageUrl));
                        //.data(visibleTiles, tileKey)
                        //.enter();
                        failedOrUnknownTileElements.append("rect")
                            .attr(rectAttrs);

                        // but always add the image element
                        newTileElements.append("image")
                            .attr(imageAttrs)
                            .attr("xlink:href", checkImage)
                            .on("error", imageLoadError, true)
                            .on("load", imageLoadSuccess, true)
                            // the following two handlers are for IE compatibility
                            .on("SVGError", imageLoadError, true)
                            // the following hack does not work in IE
                            .on("SVGLoad", imageLoadSuccess, true);

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

                        xAxis.update(xScale, [0, tilesHeightPixels], showAxis);
                    }

                    /* helper functions */


                    function getWidth() {
                        // want tilesTotalWidthPixels to be a factor of tile size
                        var containerWidth = svg.node().parentNode.getBoundingClientRect().width;
                        var availableWidth = containerWidth - (margin.left + margin.right);
                        var tileCount = Math.floor(availableWidth / tileWidthPixels);
                        return {width: tileCount * tileWidthPixels, tileCount};
                    }

                    function getTilesGroupHeight() {
                        return self.visualizationTileHeight;
                    }


                    function isNavigatable(clickDate) {
                        let roundedDate = roundDate.round(navigationOffsetRounding, clickDate),
                        // plus one to cheat the system
                        // - the range should be valid, i.e. not zero width
                            searchRange = [roundedDate, +roundedDate + 1];

                        // reuse filtering method but don't allow for padding
                        var matchedTiles = visibleTiles.filter((tile) => common.isTileVisible(searchRange, self.tileSizeSeconds, tile));

                        var url;
                        if (matchedTiles.length) {
                            // the source item that owns the tile
                            let itemFound = matchedTiles.find(tile => {
                                return common.isItemVisible(dataFunctions.getLow, dataFunctions.getHigh, searchRange, tile.source);
                            });

                            // the tile could still be outside of the item's actual range
                            // (as tiles are absolutely aligned and pad out items)
                            if (itemFound) {
                                url = getNavigateUrl(itemFound.source, roundedDate);
                            }
                        }

                        return {url, roundedDate};
                    }

                    /**
                     * Generate the tiles to show on the fly.
                     * These tiles should NOT contain references to other objects.
                     * @param source
                     * @param i
                     * @returns {Array}
                     */
                    function splitIntoTiles(source, resolution) {
                        let idealTileSizeSeconds = resolution * tileWidthPixels;

                        // coerce just in case (d3 does this internally)
                        let low = new Date(dataFunctions.getLow(source)),
                            high = new Date(dataFunctions.getHigh(source));

                        // round down to the lower unit of time, determined by `tileSizeSeconds`
                        var niceLow = roundDate.floor(idealTileSizeSeconds, low),
                        // subtract a 'tile' otherwise we generate one too many
                            niceHigh = new Date(+roundDate.ceil(idealTileSizeSeconds, high) - idealTileSizeSeconds),
                            offset = niceLow;

                        // use d3's in built range functionality to generate steps
                        var tiles = [];
                        while (offset < niceHigh) {
                            // d3's offset floor's the input! FFS!
                            //var nextOffset = d3.time.second.offset(offset, idealTileSizeSeconds);
                            var nextOffset = new Date(+offset + (idealTileSizeSeconds * msInS));
                            var item = {
                                audioNavigationUrl: getNavigateUrl(source, offset),
                                key: offset.toISOString() + dataFunctions.getId(source),
                                offset: offset,
                                offsetEnd: nextOffset,
                                resolution,
                                source,
                                tileImageUrl: "",
                                zoomStyleImage: true
                            };
                            item.tileImageUrl = getTileImage(item);
                            tiles.push(item);
                            offset = nextOffset;
                        }

                        return tiles;
                    }

                    function navigateTo() {
                        var coordinates = d3.mouse(tilesGroup.node()),
                            clickDate = xScale.invert(coordinates[0]);

                        // now see if there is a match for the date!
                        var {url} = isNavigatable(clickDate);

                        if (url) {
                            console.warn(
                                "DistributionVisualisation:TilesGroup:Click: Navigating to ",
                                url,
                                new Date(clickDate));
                            $location.url(url);
                            $rootScope.$apply();
                        }
                        else {
                            console.error(
                                "DistributionVisualisation:TilesGroup:Click: Navigation failed",
                                new Date(clickDate));
                        }
                    }

                    function getTileLeft(d, i) {
                        return xScale(d.offset);
                    }

                    //function getComment() {
                    //    return
                    //
                    //    //return `Data:: Date: ${ getOffsetDate(d) }, Time: ${ getOffsetTime(d) }, TileSize: ${ self.tileSizeSeconds.toLocaleString() }, Actual Resolution: ${ self.resolution.toFixed(4) }, Tile Resolution: ${ d.resolution }`;
                    //}

                    function getOffsetDate(d) {
                        return d.offset.toLocaleDateString();
                    }

                    function getOffsetTime(d) {
                        return d.offset.toLocaleTimeString();
                    }

                    function getNavigateUrl(d, offset) {
                        var url = dataFunctions.getNavigateUrl(
                            offset,
                            self.category,
                            self.tileSizeSeconds,
                            tileWidthPixels,
                            d
                        );

                        if (url) {
                            return url;
                        }

                        return;
                    }


                    function getTileImage(d) {
                        var url = dataFunctions.getTileUrl(d.offset,
                            self.category,
                            self.tileSizeSeconds,
                            tileWidthPixels,
                            d);

                        return url || "";
                    }

                    function getFocusStemPath(width) {
                        let w = Math.round(width || focusStemPath.width) + focusStemPath.stems,
                            hw = w / 2.0,
                            s = focusStemPath.stems,
                            r = focusStemPath.root;

                        return `m-${hw} 0 l0 ${s} l${w} 0 l0 -${s} m-${hw} ${s} l0 ${r}`;
                    }
                };
            }
        ]
    ).directive(
    "eventDistributionVisualisationMultiScale",
    [
        "conf.paths",
        "DistributionVisualisationMultiScale",
        function (paths, DistributionVisualisationMultiScale) {
            // directive definition object
            return {
                restrict: "EA",
                scope: false,
                require: "^^eventDistribution",
                templateUrl: paths.site.files.d3Bindings.eventDistribution.distributionVisualisation,
                link: function ($scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];
                    controller.visualisation.push(new DistributionVisualisationMultiScale(
                        element,
                        controller.data,
                        controller.options.functions,
                        $scope.$id));
                }
            };
        }
    ]
);
