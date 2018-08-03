/**
 * Component that
 *  - contains the button to move to the next sample,
 *  - loads the correct sample if specified in the url
 *  - updates the selected labels to match what is stored for the selected sample
 */


angular.module("bawApp.components.progress", ["bawApp.citizenScience.csSamples"])
    .component("datasetProgress", {
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams", "$url", "conf.paths", "CsSamples", "SampleLabels",
            function ($scope, $routeParams, $url, paths, CsSamples, SampleLabels) {

                var self = this;

                $scope.selectSampleById = function (itemId) {
                    console.log("selecting item", itemId);
                    CsSamples.selectById(itemId).then(x => {
                        console.log("selected sample ", x);
                        SampleLabels.registerCurrentSampleId(CsSamples.currentSample);
                    });
                };

                /**
                 * Load the new sample whenever the route params change.
                 */
                $scope.$watch(
                    function () {
                        return $routeParams.sampleNum;
                    }, function (newVal, oldVal) {
                        if ($routeParams.sampleNum) {
                            $scope.selectSampleById($routeParams.sampleNum);
                        }
                    });

                                 
                $scope.nextItem = function () {
                    console.log("next item");
                    CsSamples.nextItem();
                    SampleLabels.registerCurrentSampleId(CsSamples.currentItem());
                };

                /**
                 *
                 * @return {*}
                 */
                $scope.nextDisabled = function () {
                    return !CsSamples.nextItemAvailable();
                };

                self.progressNav = true;

            }],
        bindings: {
        }
    });