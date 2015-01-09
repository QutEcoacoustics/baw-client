/**
 * Created by Anthony.
 *
 * Intended to provide a high level overview of a distribution of
 * time-based events/records. Has zoom/filter controls that update a shared controller/scope
 * which the eventDistributionDetail directive renders.
 */
angular
    .module("bawApp.d3.eventDistribution.distributionOverview", [])
    .directive(
    "eventDistributionOverview",
    [
        function () {
            // main functions

            function setUp(element, data) {

            }



            // directive definition object
            return {
                restrict: "EA",
                scope: {
                    data: "="
                },
                link: function($scope, $element, attributes, controller, transcludeFunction) {

                    var element = $element[0];



                },
                controller:"distributionController"

            }
        }
    ]
);