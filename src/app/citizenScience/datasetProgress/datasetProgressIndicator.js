/**
 * Component that
 *  - contains the button to move to the next sample,
 *  - loads the correct sample if specified in the url
 *  - updates the selected labels to match what is stored for the selected sample
 */


angular.module("bawApp.components.progressIndicator", ["bawApp.citizenScience.csSamples", "bawApp.citizenScience.sampleLabels", "bawApp.components.onboarding"])
    .component("datasetProgressIndicator", {
        templateUrl: "citizenScience/datasetProgress/datasetProgressIndicator.tpl.html",
        controller: ["$scope", "CsSamples", "SampleLabels", "QuestionResponse", "CitizenScienceCommon", "onboardingService",
            function ($scope, CsSamples, SampleLabels, QuestionResponse, CitizenScienceCommon, onboardingService) {

                var self = this;

                $scope.progress = {
                    itemCount: 0,
                    responseCount: 0,
                    percent: -1,
                    percentCapped: -1,
                    message: ""
                };

                $scope.$watch(() => CsSamples.currentItem(), (newVal, oldVal) => {
                    // if we are moving from one item to another (not loading the first item)
                    if (newVal) {
                        self.updateProgress();
                    }
                });

                self.refreshIn = -1;

                /**
                 * called each time we go to a new segment
                 * will increment response count. We only refresh from the server sometimes
                 * to save unecessary api calls.
                 */
                self.updateProgress = function () {

                    if (self.refreshIn === -1) {
                        self.refreshProgress();
                        self.refreshIn = 5;
                    } if (self.refreshIn === 0) {
                        SampleLabels.setOnSendResponseCallback("refreshProgress", self.refreshProgress);
                        self.refreshIn = 5;
                        $scope.progress.responseCount += 1;
                    } else {
                        SampleLabels.setOnSendResponseCallback("refreshProgress", null);
                        $scope.progress.responseCount += 1;
                    }

                    self.updateProgressPercent();
                    self.refreshIn -= 1;

                };


                onboardingService.addSteps({
                    element: ".progress",
                    intro: "How many items have been completed out of the total amount. ",
                    order: 3
                }, "questionResponses");

                /**
                 * Watch the total items, because it will not be ready when the controller first loads
                 */
                $scope.$watch(CsSamples.totalItems, (newVal, oldVal) => {
                    if (typeof newVal === "number") {
                        $scope.progress.itemCount = newVal;
                        self.updateProgressPercent();
                    }
                });


                /**
                 * gets the total number of responses from the server
                 */
                self.refreshProgress = function () {

                    // make sure the study has been loaded
                    if (CitizenScienceCommon.studyData.study) {

                        // request 1 item to get the metadata showing the total number of items
                        var responseFilterParams = {
                            studyId: CitizenScienceCommon.studyData.study.id,
                            items: 1
                        };

                        QuestionResponse.questionResponses(responseFilterParams).then((x) => {

                            var totalResponses = x.data.meta.paging.total;
                            $scope.progress.responseCount = totalResponses;
                            self.updateProgressPercent();
                            self.refreshIn = 5;
                            onboardingService.ready("questionResponses");

                        });

                    }

                };


                /**
                 * updates the percent tracker
                 * Necessary ecause we can go over 100% if there are more responses than items
                 */
                self.updateProgressPercent = function () {

                    if ($scope.progress.itemCount === 0) {
                        return;
                    }

                    var percent = Math.round(100 * $scope.progress.responseCount / $scope.progress.itemCount);
                    $scope.progress.percent = percent;
                    console.log("$scope.progress.percent", percent);
                    $scope.progress.percentCapped = Math.min(percent, 100);
                    $scope.progress.message =  `${$scope.progress.responseCount + 1} / ${$scope.progress.itemCount}`;
                };


            }],
        bindings: {
        }
    });