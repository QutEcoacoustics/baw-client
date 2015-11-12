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
        function ($location, $rootScope, d3, roundDate, TimeAxis) {
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
                        width: 100,
                        stems: 4,
                        root: 8
                    },
                    tilesClipRect,

                    tileSizePixels = 180,
                    tileCount = 0,
                // default value, overridden almost straight away
                    tilesHeight = 256,
                // default value, overridden almost straight away
                    tilesWidth = 1440,
                // 86400 seconds
                    //oneDay = 60 * 60 * 24,
                // round to nearest 30 seconds for navigation urls
                    navigationOffsetRounding = 30,



                    clipId = "distributionVisualizationMultiScale_" + uniqueId,
                    xScale,
                    yScale,
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
                    successfulImages = new Set();

                const timeFormatter = d3.time.format("%H:%M:%S");

                // exports
                self.items = [];
                self.nyquist = 11025;
                self.spectrogramWindowSize = 512;
                self.visibleDuration = null;
                self.middle = null;
                self.category = null;
                self.updateData = updateData;
                self.updateMiddle = updateMiddle;
                self.tileSizeSeconds = null;
                // seconds per pixel
                self.resolution = null;
                self.zoomScale = 1;

                // init
                create();

                /* exported functions */

                function updateData(data) {
                    updateDataVariables(data);

                    setDimensions();

                    updateScales();

                    generateTiles();

                    visibleTiles = filterTiles(visibleExtent, self.category);

                    updateElements();

                    // pulling our y-axis update because yScale never changes for updateMiddle
                    // and thus only changes from update data
                    yAxis.scale(yScale).tickValues(yScale.ticks(10).slice(0, -1).concat([self.nyquist]));
                    yAxisGroup.call(yAxis);
                }

                function updateMiddle(newMiddle, category, zoomScale) {
                    self.middle = newMiddle;
                    self.category = category;
                    self.zoomScale = zoomScale;

                    updateScales();

                    visibleTiles = filterTiles(visibleExtent, self.category);

                    updateElements();
                }

                /* internal functions*/

                function create() {
                    updateDataVariables(data);

                    setDimensions();

                    updateScales();

                    generateTiles();

                    createElements();
                }

                function updateDataVariables(data) {
                    // data should be an array of items with extents
                    self.items = data.items;
                    self.maximum = data.maximum;
                    self.minimum = data.minimum;
                    self.nyquistFrequency = data.nyquistFrequency;
                    self.spectrogramWindowSize = data.spectrogramWindowSize;
                    self.middle = null;
                    self.zoomScale = 1;
                }

                function setDimensions() {
                    let widths =  getWidth();
                    tilesWidth = widths.width;
                    tileCount = widths.tileCount;


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

                    focusLine.attr("height", tilesHeight + focusStemPath.root);
                    focusTextGroup.translate(() => [0, -(focusStemPath.root + focusStemPath.stems)]);
                }

                function updateScales() {
                    updateVisibleDurationAndTileResolution();

                    // calculate then end date for the domain
                    var halfVisibleDuration = self.visibleDuration / 2.0;
                    visibleExtent[0] = d3.time.second.offset(self.middle, -halfVisibleDuration);
                    visibleExtent[1] = d3.time.second.offset(self.middle, halfVisibleDuration);

                    xScale = d3.time.scale()
                        .domain(visibleExtent)
                        .range([0, tilesWidth]);

                    yScale = d3.scale.linear()
                        // inverted y-axis
                        .domain([self.nyquistFrequency, 0])
                        .range([0, tilesHeight]);
                }

                /**
                 * Calculate the amount of the true extent that can be shown at
                 * a certain scale.
                 * @param dataExtents - date time objects in an array
                 * @param zoomScale
                 */
                function updateVisibleDurationAndTileResolution() {
                    let min = +self.minimum || 0,
                        max = +self.maximum || 0,
                        delta = max -  min,
                        visibleFraction = delta / self.zoomScale;

                    // finally, convert to seconds
                    self.visibleDuration = visibleFraction / 1000;

                    // TODO: snap tile domain to zoom levels that are available
                    self.tileSizeSeconds = self.visibleDuration / tileCount;

                    self.resolution = self.tileSizeSeconds / tileSizePixels;

                    // update the controller with the visible tilesWidth
                    // NOTE: this control does not need to do this because it uses the same width as the detail control!
                    //dataFunctions.visualisationDurationUpdate(self.visibleDuration);

                }


                function generateTiles() {
                    if (self.items && self.items.length > 0) {
                        // need to generate a series of tiles that can show the data in self.items
                        self.items.forEach(function (current) {
                            // warning: to future self: this is creating cyclic references
                            // as each tile keeps a reference to current
                            current.tiles = splitIntoTiles(current);
                        });
                    }
                }

                function filterTiles(visibleExtent, category) {
                    var filterPaddingMs = self.tileSizeSeconds * 1000;
                    // item filter
                    // pad the filtering extent with tileSize so that recordings that have
                    // duration < tileSize aren't filtered out prematurely
                    var fExtent = [(+visibleExtent[0]) - filterPaddingMs, (+visibleExtent[1]) + filterPaddingMs],
                        f = isItemVisible.bind(null, fExtent),
                        g = isInCategory.bind(null, category),
                        h = and.bind(null, g, f);

                    // tile filter
                    var l = isTileVisible.bind(null, visibleExtent);

                    return self.items
                        .filter(h)
                        .reduce(function (previous, current) {
                            var t = current.tiles.filter(l);
                            return previous.concat(t);
                        }, [])
                        .sort(sortTiles);
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

                    tilesGroup.on("click", navigateTo);

                    xAxis = new TimeAxis(main, xScale, {position: [0, tilesHeight], isVisible: false});
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
                    var imageAttrs = {
                        height: tilesHeight,
                        width: tileSizePixels
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
                    focusStem.attr("d", getFocusStemPath(focusText.node().getComputedTextLength()));

                    // create data join
                    var tileElements = tilesGroup.selectAll(".tile")
                        .data(visibleTiles, tileKey);

                    // update old tiles
                    tileElements.translate(tileGTranslation)
                        .select("image")
                        .attr("xlink:href", checkImage);

                    tileElements
                        .select("text.resolution")
                        .text(d => `Duration: ${ self.tileSizeSeconds.toLocaleString() }`);

                    // add new tiles
                    var newTileElements = tileElements.enter()
                        .append("g")
                        .translate(tileGTranslation)
                        .classed("tile", true);

                    // optimize: if we've successfully downloaded a tile before
                    // then we don't need these placeholder tiles
                    var failedOrUnknownTileElements =
                        newTileElements.filter(d => !successfulImages.has(d.tileImageUrl));
                        //.data(visibleTiles, tileKey)
                        //.enter();
                    failedOrUnknownTileElements.append("rect")
                        .attr(imageAttrs);

                    failedOrUnknownTileElements.append("text")
                        .text(getOffsetDate)
                        .attr({
                            y: tilesHeight / 2.0,
                            x: tileSizePixels / 2.0,
                            width: tilesWidth,
                            "text-anchor": "middle",
                            dy: "0em"
                        });
                    failedOrUnknownTileElements.append("text")
                        .text(getOffsetTime)
                        .attr({
                            y: tilesHeight / 2.0,
                            x: tileSizePixels / 2.0,
                            width: tileSizePixels,
                            "text-anchor": "middle",
                            dy: "1em"
                        });
                    failedOrUnknownTileElements.append("text")
                        .text(d => `Duration: ${ self.tileSizeSeconds.toLocaleString() }`)
                        .attr({
                            y: tilesHeight / 2.0,
                            x: tileSizePixels / 2.0,
                            width: tileSizePixels,
                            "text-anchor": "middle",
                            "class": "resolution",
                            dy: "2em"
                        });

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

                    xAxis.update(xScale, [0, tilesHeight], showAxis);
                }

                /* helper functions */



                function getWidth() {
                    // want tilesWidth to be a factor of tile size
                    var containerWidth = svg.node().parentNode.getBoundingClientRect().width;
                    var availableWidth = containerWidth - (margin.left + margin.right);
                    var tileCount = Math.floor(availableWidth / tileSizePixels);
                    return {width: tileCount * tileSizePixels, tileCount};
                }

                function getTilesGroupHeight() {
                    return (self.spectrogramWindowSize / 2);
                }

                function isInCategory(category, d) {
                    return dataFunctions.getCategory(d) === category;
                }

                function isItemVisible(filterExtent, d) {
                    return dataFunctions.getLow(d) < filterExtent[1] &&
                        dataFunctions.getHigh(d) >= filterExtent[0];
                }

                function and(a, b, d) {
                    return a(d) && b(d);
                }

                function isTileVisible(visibleExtent, d) {
                    return d &&
                        d.offset < visibleExtent[1] &&
                        d.offsetEnd >= visibleExtent[0];
                }

                function isNavigatable(clickDate) {
                    let roundedDate = roundDate.round(navigationOffsetRounding, clickDate),
                        // plus one to cheat the system
                        // - the range should be valid, i.e. not zero width
                        searchRange = [roundedDate, +roundedDate + 1];

                    // reuse filtering method but don't allow for padding
                    var matchedTiles = visibleTiles.filter((tile) => isTileVisible(searchRange, tile));

                    var url;
                    if (matchedTiles.length) {
                        // the source item that owns the tile
                        let itemFound = matchedTiles.find(tile => {
                            return isItemVisible(searchRange, tile.source);
                        });

                        // the tile could still be outside of the item's actual range
                        // (as tiles are absolutely aligned and pad out items)
                        if (itemFound) {
                            url = getNavigateUrl(itemFound.source, roundedDate);
                        }
                    }

                    return {url, roundedDate};
                }

                function splitIntoTiles(current, i) {
                    // coerce just in case (d3 does this internally)
                    var low = new Date(dataFunctions.getLow(current)),
                        high = new Date(dataFunctions.getHigh(current));

                    // round down to the lower unit of time, determined by `tileSizeSeconds`
                    var niceLow = roundDate.floor(self.tileSizeSeconds, low),
                        // subtract a 'tile' otherwise we generate one too many
                        niceHigh = roundDate.ceil(self.tileSizeSeconds, high) - self.tileSizeSeconds,
                        offset = niceLow;

                    // use d3's in built range functionality to generate steps
                    var steps = [];
                    while (offset < niceHigh) {
                        var nextOffset = d3.time.second.offset(offset, self.tileSizeSeconds);
                        var item = {
                            offset: offset,
                            offsetEnd: nextOffset,
                            source: current,
                            key: offset.toISOString() + dataFunctions.getId(current),
                            audioNavigationUrl: getNavigateUrl(current, offset),
                            tileImageUrl: ""
                        };
                        item.tileImageUrl = getTileImage(item);
                        steps.push(item);
                        offset = nextOffset;
                    }

                    return steps;
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
                        tileSizePixels,
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
                        tileSizePixels,
                        d);

                    if (url) {
                        return url;
                    }

                    return "";
                }

                /**
                 * Order tiles based on their date. This allows elements to be painted in the
                 * DOM in the right order
                 * @param tileA
                 * @param tileB
                 */
                function sortTiles(tileA, tileB) {
                    return tileA.offset - tileB.offset;
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