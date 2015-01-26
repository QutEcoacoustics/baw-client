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
                // 86400 seconds
                    oneDay = 60 * 60 * 24,
                    tileSizePixels = 60,
                    tileSizeSeconds = 60 * 60,
                // seconds per pixel
                    resolution = oneDay / resolution,
                // +1 so that 0.5 tile can fall off either end
                    tileCount = (oneDay / tileSizeSeconds) + 1;

                // exports


                // init
                create();

                // functions
                function create() {
                    setDimensions();

                    updateAxis();


                    createElements();

                }

                function setDimensions() {

                }

                function updateAxis() {

                }

                function createElements() {
                    tiles.selectAll(".tile")
                        .data(d3.range(tileCount))
                        .enter()
                        .append("div")
                        .style("top", 0)
                        .style("left", function (d, i) {
                                      return (i * 60) + "px";
                                  })
                        .style("width", tileSizePixels + "px")
                        .attr("class", "tile");
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