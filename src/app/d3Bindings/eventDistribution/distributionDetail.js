/**
 * Created by Anthony.
 *
 * Intended to provide a detailed view of a distribution of
 * time-based events/records. Has zoom/filter controls that update a shared controller/scope
 * which the eventDistributionOverview directive renders.
 */
angular
    .module("bawApp.d3.eventDistribution.distributionDetail", [])
    .directive(
    "eventDistributionDetail",
    [
        function () {

        }
    ]
);