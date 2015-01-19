angular
    .module("bawApp.d3.eventDistribution.distributionController", [])
    .controller(
    "distributionController",
    [
        "$scope",
        function distributionController($scope, $element, $attrs) {
            console.debug("event distribution controller:init");

            $scope.test = "hello world";

            this.test = function() {
                alert("hello world2");
            }
        }
    ])
    .directive(
    "eventDistribution",
    function() {
        return {
            controller: "distributionController"
        }
    }
);