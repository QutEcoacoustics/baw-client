/**
 * Created by Anthony.
 *
 * Intended to show the visualisation chosen by the other event distribution controls
 * A large visual surface of html elements, still controlled by d3
 *
 */
angular
    .module("bawApp.d3.eventDistribution.distributionVisualisation", [])
    .service(
    "DistributionVisualisation",
    [
        "d3",
        "roundDate",
        function (d3, roundDate) {
            return function DistributionVisualisation(target, data, dataFunctions) {
                // variables
                var that = this,
                    container = d3.select(target),
                    metaTrack = container.select(".metaTrack"),
                    tiles = container.select(".imageTrack .tiles"),

                    tileSizePixels = 60,
                    tileSizeSeconds = 60 * 60,

                    // default value, overridden almost straight away
                    height = 256,
                    // default value, overridden almost straight away
                    width = 1440,
                    // 86400 seconds
                    oneDay = 60 * 60 * 24,


                    // seconds per pixel
                    resolution = updateResolution(),

                    xScale,
                    yScale,

                    visibleExtent = [],
                    generatedTiles = [];

                // exports
                that.items = [];
                that.nyquist = 11025;
                that.spectrogramWindowSize = 512;
                that.visibleDuration = oneDay;
                that.middle = null;
                that.updateData = updateData;
                that.updateMiddle = updateMiddle;



                // init
                create();

                // functions
                function updateData(data) {
                    updateDataVariables(data);

                    setDimensions();

                    updateScales();

                    generateTiles();

                    updateElements();

                }

                function updateMiddle(newMiddle, category) {
                    that.middle = newMiddle;
                    that.category = category;

                    generateTiles();

                    updateElements();
                }

                function create() {
                    updateDataVariables(data);

                    setDimensions();

                    updateScales();

                    createElements();

                }

                function updateDataVariables(data) {
                    // data should be an array of items with extents
                    that.items = data.items;
                    that.nyquistFrequency = data.nyquistFrequency;
                    that.spectrogramWindowSize = data.spectrogramWindowSize;
                    that.middle = null;
                }

                function setDimensions() {
                    var widths = getWidth();
                    width = widths.width;
                    that.visibleDuration = widths.duration;

                    tiles.style("width", width + "px");


                    // want height to be a function of nyquistRate and window
                    height = getHeight();
                    tiles.style("height", height + "px");
                }

                function updateScales() {
                    // calculate then end date for the domain
                    var halfVisibleDuration = that.visibleDuration / 2.0;
                    visibleExtent[0] = d3.time.second.offset(that.middle, -halfVisibleDuration);
                    visibleExtent[1] = d3.time.second.offset(that.middle, halfVisibleDuration);

                    xScale = d3.time.scale()
                        .domain(visibleExtent)
                        .range([0, width]);

                    yScale = d3.scale.linear()
                        .domain([0, 1])
                        .range([0, height]);
                }

                function generateTiles() {
                    if (that.items.length > 0) {
                        // need to generate a series of tiles that can show the data in that.items
                        var f = isItemVisible.bind(null, that.visibleDuration),
                            g = isInCategory.bind(null, that.category),
                            h = and.bind(null, f, g);

                        var filteredItems = that.items.filter(h);

                        generatedTiles = filteredItems.reduce(splitIntoTiles, []);
                    }
                    else {
                        generatedTiles = [];
                    }
                }

                function createElements() {
                    // this example has an associated html template...
                    // most of the creation is not necessary

                    updateElements();
                }

                function updateElements() {
                    tiles.selectAll(".tile")
                        .data(generatedTiles)
                        .enter()
                        .append("div")
                        .style("top", 0)
                        .style("left", function (d, i) {
                            return ((i * 60) - 30) + "px";
                        })
                        .style("width", tileSizePixels + "px")
                        .attr("class", "tile");

                }

                function updateResolution() {
                    resolution = tileSizeSeconds / tileSizePixels;
                    return resolution;
                }

                function getWidth() {
                    // want width to be a factor of tile size
                    var containerWidth = tiles.node().parentNode.getBoundingClientRect().width;
                    var tileCount = Math.floor(containerWidth / tileSizePixels);
                    return {width: tileCount * tileSizePixels, duration: tileCount * tileSizeSeconds};
                }

                function getHeight() {
                    return that.spectrogramWindowSize / 2;
                }

                function isInCategory(category, d) {
                    return dataFunctions.getCategory(d) === category;
                }

                function isItemVisible(visibleExtent, d) {
                    return dataFunctions.getLow(d) < visibleExtent[1] &&
                        dataFunctions.getHigh(d) > visibleExtent[0];
                }

                function and(a, b, d) {
                    return a(d) && b(d);
                }

                function splitIntoTiles(previous, current, i) {
                    // coerce just in case (d3 does this internally)
                    var low = new Date(dataFunctions.getLow(current)),
                        high = new Date(dataFunctions.getHigh(current));

                    // round down to the lower unit of time, determined by `tileSizeSeconds`
                    var niceLow = roundDate.floor(tileSizeSeconds, low),
                        niceHigh = roundDate.ceil(tileSizeSeconds, high),
                        offset = niceLow;

                    // use d3's in built range functionality to generate steps
                    var steps = [];
                    while (offset <= niceHigh) {
                        steps.push({
                            offset: offset,
                            source: current
                        });
                        offset = d3.time.second.offset(offset, tileSizeSeconds);
                    }

                    return previous.concat(steps);
                }


            }
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
                controller: "distributionController",
                require: "^^eventDistribution",
                templateUrl: paths.site.files.d3Bindings.eventDistribution.distributionVisualisation,
                link: function ($scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];
                    controller.visualisation = new DistributionVisualisation(
                        element,
                        controller.data,
                        controller.options.functions);
                }
            }
        }
    ]
);