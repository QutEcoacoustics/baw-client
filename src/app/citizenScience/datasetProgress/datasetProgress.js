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

                var self = this;


                // need to wait for the study's dataset_id before initialising
                $scope.$watch(function () { return self.datasetId; }, function (newVal, oldVal){
                    if (newVal > 0) {
                        if ($routeParams.sampleNum) {
                            CsSamples.selectById($routeParams.sampleNum);
                            $scope.nextItem = function () {
                                SampleLabels.sendResponse("using_routed");
                                return true;
                            };
                            $scope.isRoutedSample = true;
                        } else {
                            CsSamples.init(self.datasetId);
                            $scope.nextItem = function () {
                                SampleLabels.sendResponse();
                                CsSamples.nextItem();
                            };
                            $scope.isRoutedSample = false;
                        }
                    }
                });

                $scope.$watch(() => CsSamples.currentItem(), (newVal, oldVal) => {
                    SampleLabels.reset(newVal.id);
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
            datasetId: "="
        }
    });