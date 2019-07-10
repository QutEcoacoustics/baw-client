/**
 * Component that
 *  - contains the button to move to the next sample,
 *  - loads the correct sample if specified in the url
 *  - updates the selected labels to match what is stored for the selected sample
 */

angular.module("bawApp.components.progress", ["bawApp.citizenScience.csSamples"])
    .component("datasetProgress", {
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams", "CsSamples", "SampleLabels", "$url", "conf.paths",
            function ($scope, $routeParams, CsSamples, SampleLabels, $url, paths) {

                var self = this;

                // routed dataset item id will link back to the unrouted listen page
                $scope.listenLink = $url.formatUri(paths.site.ngRoutes.citizenScience.listen,
                    {studyName: $routeParams.studyName});


                // need to wait for the study's dataset_id before initialising
                $scope.$watch(function () { return self.datasetId; }, function (newVal, oldVal){
                    if (newVal > 0) {
                        if ($routeParams.sampleNum) {
                            CsSamples.selectById($routeParams.sampleNum);
                            $scope.nextItem = function () {
                                if (!$scope.nextDisabled(false)) {
                                    SampleLabels.sendResponse("using_routed");
                                    return true;
                                }

                            };
                            $scope.isRoutedSample = true;
                        } else {
                            CsSamples.init(self.datasetId);
                            $scope.nextItem = function () {
                                // TODO: handle end of dataset
                                if (!$scope.nextDisabled(true)) {
                                    SampleLabels.sendResponse();
                                    CsSamples.nextItem();
                                }
                            };
                            $scope.isRoutedSample = false;
                        }
                    }
                });

                $scope.$watch(() => CsSamples.currentItem(), (newVal, oldVal) => {
                    if (newVal) {
                        SampleLabels.reset(newVal.id);
                    }
                });

                $scope.$on("autoNextTrigger", function (x) {
                    SampleLabels.sendResponse("autoplay");
                    CsSamples.nextItem();
                });


                /**
                 * whether to disable the next button, both greying out and preventing actions
                 * @return boolean
                 */
                $scope.nextDisabled = function (requireNextItemAvailable = false) {

                    // default to allow empty if not specified
                    var enabled = SampleLabels.hasResponse() || SampleLabels.allowEmpty();
                    enabled = enabled && (!requireNextItemAvailable || CsSamples.nextItemAvailable());
                    return !enabled;

                };

                /**
                 * Return the text that should display on the button. Might change depending on
                 * if they have selected a label or if there is another sample after the current.
                 * @return {*}
                 */
                $scope.nextText = function () {
                    if (SampleLabels.hasResponse()) {
                        return "Submit response";
                    } else {

                        if (SampleLabels.allowEmpty() || SampleLabels.allowEmpty() === undefined) {

                            if (CsSamples.nextItemAvailable()) {
                                return "Nothing here, next sample";
                            } else {
                                return "Nothing here";
                            }

                        } else {
                            return "Enter a response";
                        }

                    }
                };

            }],
        bindings: {
            datasetId: "="
        }
    });