angular.module("bawApp.components.citizenScienceThumbLabels.examples",
    [
        "bawApp.citizenScience.common"
    ])
    .component("citizenScienceLabelExamples", {
        templateUrl: "citizenScience/thumbLabels/examples.tpl.html",
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
                    var l = self.examples.length;
                    // add changeBy and wrap if the result is larger than length
                    $scope.currentExample = (($scope.currentExample + changeBy % l) + l) % l;
                    console.log("changed cur example for label " + self.label + " to " + $scope.currentExample);
                };


                /**
                 * initialises curExample after examples have been loaded (they are loaded async)
                 */
                $scope.$watch(function () {
                    return self.examples;
                }, function (newValue, oldValue) {

                    if (Array.isArray(newValue)) {
                        if (newValue.length) {
                            $scope.currentExample = 0;
                        } else {
                            $scope.currentExample = -1;
                        }
                    }

                });


                $scope.$watch("currentExample", function (newVal, oldVal) {

                    console.log("self.examples[$scope.currentExample].annotation",self.examples[$scope.currentExample].annotation);

                });






            }],
        bindings: {
            examples: "=examples",
            label: "=label"
        }
    });