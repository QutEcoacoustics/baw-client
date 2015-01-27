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
        function (d3) {
            return function DistributionVisualisation(target, data, dataFunctions) {
                // variables
                var that = this,
                    container = d3.select(target),
                    metaTrack = container.select(".metaTrack"),
                    tiles = container.select(".imageTrack .tiles"),

                    // default value, overridden almost straight away
                    height = 256,
                    // default value, overridden almost straight away
                    width = 1440,

                    // 86400 seconds
                    oneDay = 60 * 60 * 24,
                    tileSizePixels = 60,
                    tileSizeSeconds = 60 * 60,
                    // seconds per pixel
                    resolution = updateResolution(),

                    xScale,
                    yScale,

                    // +1 so that 0.5 tile can fall off either end
                    tileCount = (oneDay / tileSizeSeconds) + 2;

                // exports
                that.extents = [];
                that.nyquist = 11025;



                // init
                create();

                // functions
                function updateData(data) {
                    updateDataVariables(data);

                    updateScales()
                }

                function create() {
                    updateDataVariables(data);

                    setDimensions();

                    updateScales();

                    createElements();

                }

                function updateDataVariables(data) {
                    // data should be an array of extents
                    that.extents = data.extents;
                    that.nyquistFrequency = data.nyquistFrequency;
                }

                function setDimensions() {
                    // want width to be a factor of tile size
                    var containerWidth = tiles.node().parentNode.getBoundingClientRect().width;
                    var tileCount = Math.floor(containerWidth / tileSizePixels);
                    //tileCount = tiles + 1;
                    width = tileCount * tileSizePixels;
                    tiles.style("width", width + "px");


                    // want height to be a function of nyquistRate
                    height = yScale(that.nyquist);
                    tiles.style("height", height)

                }

                function updateScales() {

                    xScale = d3.scale.linear()//time.scale()
                        .domain([0, 1])
                        .range([0, 1]);

                    yScale = d3.scale.linear()
                        .domain([0, 1])
                        .range([0, 1]);
                }

                function createElements() {
                    tiles.selectAll(".tile")
                        .data(d3.range(tileCount))
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

                function updateTileCount()  {

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
                    controller.visualisation = new DistributionVisualisation(element, [], {});
                }
            }
        }
    ]
);