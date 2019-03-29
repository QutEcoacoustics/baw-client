/**
 * Component that
 *  - contains the button to move to the next sample,
 *  - loads the correct sample if specified in the url
 *  - updates the selected labels to match what is stored for the selected sample
 */


angular.module("bawApp.components.progress", ["bawApp.citizenScience.csSamples"])
    .component("datasetProgress", {
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams", "CsSamples", "SampleLabels",
            function ($scope, $routeParams, CsSamples, SampleLabels) {

                if ($routeParams.sampleNum) {
                    CsSamples.selectById($routeParams.sampleNum);
                    $scope.nextItem = function () {
                        SampleLabels.sendResponse("using_routed");
                        return true;
                    };
                    $scope.isRoutedSample = true;
                } else {
                    CsSamples.init();
                    $scope.nextItem = function () {
                        SampleLabels.sendResponse();
                        CsSamples.nextItem();
                    };
                    $scope.isRoutedSample = false;
                }



                $scope.$watch(() => CsSamples.currentItem(), (newVal, oldVal) => {
                    var newDatasetItemId = newVal.id;
                    SampleLabels.reset(newDatasetItemId);
                });

                $scope.$on("autoNextTrigger", function (x) {
                    SampleLabels.sendResponse("autoplay");
                    CsSamples.nextItem();
                });

                /**
                 *
                 * @return boolean
                 */
                $scope.nextDisabled = function () {
                    return !CsSamples.nextItemAvailable();
                };

                $scope.nextText = function () {
                    if (SampleLabels.hasResponse()) {
                        return "Done! Next sample";
                    } else {
                        return "Nothing here, next sample";
                    }
                };

            }],
        bindings: {
        }
    });