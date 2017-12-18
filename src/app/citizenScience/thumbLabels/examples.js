angular.module("bawApp.components.citizenScienceThumbLabels.examples",
    [
        "bawApp.citizenScience.common",
        "bawApp.components.citizenScienceLabelCheck"
    ])
    .component("citizenScienceLabelExamples", {
        templateUrl: "citizenScience/thumbLabels/examples.tpl.html",
        transclude: true,
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            "annotationLibraryCommon",
            "AudioEvent",
            "baw.models.AudioEvent",
            function ($scope, $http, CitizenScienceCommon, libraryCommon, AudioEventService, AudioEvent) {

                var self = this;

                $scope.currentExample = -1;

                $scope.changeCurrentExample = function (labelNum, changeBy) {
                    var l = self.label.examples.length;
                    // add changeBy and wrap if the result is larger than length
                    $scope.currentExample = (($scope.currentExample + changeBy % l) + l) % l;
                    console.log("changed cur example for label " + self.label + " to " + $scope.currentExample);
                };

                /**
                 * initialises curExample after examples have been loaded (they are loaded async)
                 */
                $scope.$watch(function () {
                    return self.label.examples;
                }, function (newValue, oldValue) {

                    if (Array.isArray(newValue)) {
                        if (newValue.length) {
                            $scope.currentExample = 0;
                        } else {
                            $scope.currentExample = -1;
                        }
                    }

                });

            }],
        bindings: {
            label: "=",
        }
    })
    .directive("centerInWindow", [
        "$window",
        function ($window) {

            return {
                restrict: "A",
                link: function (scope, $element) {

                    var el = $element[0];

                    function recenter() {
                        if (!el || !el.offsetParent) {
                            return;
                        }
                        var offset = el.offsetParent.getBoundingClientRect().left;
                        el.style.width = $window.innerWidth - 50 + "px";
                        el.style.left = (15 - offset) + "px";
                    }

                    recenter();
                    angular.element($window).bind("resize", recenter);

                }
            };
        }]);
