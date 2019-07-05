/**
 * Component that
 *  - contains the button to move to the next sample,
 *  - loads the correct sample if specified in the url
 *  - updates the selected labels to match what is stored for the selected sample
 */


angular.module("bawApp.components.progressIndicator", ["bawApp.citizenScience.csSamples"])
    .component("datasetProgressIndicator", {
        templateUrl: "citizenScience/datasetProgress/datasetProgressIndicator.tpl.html",
        controller: ["$scope", "CsSamples", "QuestionResponse", "CitizenScienceCommon",
            function ($scope, CsSamples, QuestionResponse, CitizenScienceCommon) {

                var self = this;

                $scope.progress = {
                    itemCount: 0,
                    responseCount: 0,
                    percent: -1,
                    percentCapped: -1,
                    message: ""
                };

                $scope.$watch(() => CsSamples.currentItem(), (newVal, oldVal) => {
                    self.updateProgress();
                });

                self.refreshIn = 0;

                /**
                 * called each time we go to a new segment
                 * will increment response count. We only refresh from the server sometimes
                 * to save unecessary api calls.
                 */
                self.updateProgress = function () {

                    if (self.refreshIn === 0) {
                        self.refreshProgress();
                        self.refreshIn = 5;
                    }
                    $scope.progress.responseCount += 1;
                    self.updateProgressPercent();
                    self.refreshIn -= 1;

                };


                /**
                 * Update progress when the study changes. It will not be loaded when this controller is initialised
                 */
                $scope.$watch(() => CitizenScienceCommon.studyData.study, (newVal, oldVal) => {
                    self.refreshProgress();
                });

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
                    $scope.progress.message =  `${$scope.progress.responseCount} / ${$scope.progress.itemCount}`;
                };


            }],
        bindings: {
        }
    });