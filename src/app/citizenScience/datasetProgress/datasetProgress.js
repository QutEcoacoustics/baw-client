/**
 * Component that
 *  - contains the button to move to the next sample,
 *  - loads the correct sample if specified in the url
 *  - updates the selected labels to match what is stored for the selected sample
 */


angular.module("bawApp.components.progress", ["bawApp.citizenScience.csSamples"])
    .component("datasetProgress", {
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams", "CsSamples", "SampleLabels", "$url", "conf.paths", "QuestionResponse", "CitizenScienceCommon",
            function ($scope, $routeParams, CsSamples, SampleLabels, $url, paths, QuestionResponse, CitizenScienceCommon) {

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

                    self.updateProgress();

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
                $scope.nextDisabled = function (requireNextItemAvailable = false) {

                    // default to allow empty if not specified
                    var enabled = SampleLabels.hasResponse() || SampleLabels.allowEmpty();
                    enabled = enabled && (!requireNextItemAvailable || CsSamples.nextItemAvailable());
                    return !enabled;

                };

                $scope.nextText = function () {
                    if (SampleLabels.hasResponse()) {
                        return "Submit response";
                    } else {

                        if (self.allowEmpty || self.allowEmpty === undefined) {

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


                $scope.progress = {
                    itemCount: 0,
                    responseCount: 0,
                    percent: 0,
                    breaks: false

                };

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
                    self.updateProgressBreaks();
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
                        self.updateProgressBreaks();
                    }
                });


                /**
                 * gets the total number of dataset items and the total number of responses
                 * and calculates the percentage.
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
                            self.updateProgressBreaks();
                            self.refreshIn = 5;

                        });

                    }

                };

                /**
                 * Progress is rendered a 5x5 grid of divs
                 * each item represents 1 25th of the total number of items
                 * e.g. if there are 2500 items, the first point represents 100 items.
                 */
                self.updateProgressBreaks = function () {

                    var numBreaks = 25;

                    if (!$scope.progress.breaks) {
                        $scope.progress.breaks = new Array(numBreaks);
                    }

                    if ($scope.progress.itemCount === 0) {
                        return;
                    }


                    var fullBreaks = ($scope.progress.responseCount / $scope.progress.itemCount) * numBreaks;
                    // number of completely full breaks. Because it's possible to be more than 100% complete
                    // this is also capped
                    var numFull = Math.min(Math.floor(fullBreaks), numBreaks);

                    $scope.progress.breaks.fill(1, 0, numFull);
                    $scope.progress.breaks.fill(0, numFull , numBreaks);
                    if (numFull < numBreaks) {
                        $scope.progress.breaks[numFull] = fullBreaks % 1;
                    }

                    var percent = Math.round(100 * $scope.progress.responseCount / $scope.progress.itemCount);
                    $scope.progress.percent = percent;
                    console.log("$scope.progress.percent", percent);
                    $scope.progress.percentCapped = Math.min(percent, 100);



                };




            }],
        bindings: {
            datasetId: "="
        }
    });