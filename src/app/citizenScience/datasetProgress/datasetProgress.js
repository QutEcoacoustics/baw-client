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
                    $scope.nextItem = false;
                } else {
                    CsSamples.init();
                    $scope.nextItem = function () {
                        console.log("next item");
                        CsSamples.nextItem();
                    };
                }

                $scope.$watch(() => CsSamples.currentItem(), (newVal, oldVal) => {
                    SampleLabels.registerCurrentSampleId(CsSamples.currentItem().id);
                });

                /**
                 *
                 * @return boolean
                 */
                $scope.nextDisabled = function () {
                    return !CsSamples.nextItemAvailable();
                };

            }],
        bindings: {
        }
    });