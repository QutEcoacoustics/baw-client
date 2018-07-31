angular.module("bawApp.components.progress", ["bawApp.citizenScience.csSamples"])
    .component("datasetProgress", {
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams", "$url", "conf.paths", "CsSamples", "SampleLabels",
            function ($scope, $routeParams, $url, paths, CsSamples, SampleLabels) {

                var self = this;


                $scope.selectItem = function (itemId) {
                    console.log("selecting item", itemId);
                    self.currentSample = CsSamples.getSample(itemId);
                    if (self.currentSample) {
                        SampleLabels.registerCurrentSampleId(self.currentSample.id);
                        $scope.totalSamplesViewed = SampleLabels.getNumSamplesViewed();
                        console.log("setting selected to ", itemId);
                    }
                };

                // don't do this yet, because we'll watch for ready
                //$scope.selectItem($routeParams.sampleNum);

                /**
                 * Load the new sample whenever the route params change.
                 */
                $scope.$watch(
                    function () {
                        return $routeParams.sampleNum;
                    }, function (newVal, oldVal) {
                        console.log("route params changed from ", oldVal, "to", newVal);

                        // call the api to get the sample based on the route params
                        $scope.selectItem($routeParams.sampleNum);

                    });

                /**
                 * Load sample when the list of samples is ready
                 */

                $scope.$watch(
                    function () {
                        return CsSamples.isReady;
                    },
                    function (newVal, oldVal) {
                        if (newVal) {
                            $scope.selectItem($routeParams.sampleNum);
                        }
                    },
                    true);


                //TODO: this gets called constantly while the audio is playing
                /**
                 * returns a link for routing based on the id for the next and
                 * previous samples. That id is returned in the request for metadata of
                 * the current sample (contained in the route).
                 * @returns string
                 */
                $scope.previousLink = function () {
                    if (self.currentSample.previousSampleId) {
                        return $url.formatUri(paths.site.ngRoutes.citizenScience.listen, {sampleNum: self.currentSample.previousSampleId});
                    } else {
                        return "";
                    }
                };
                $scope.nextLink = function () {
                    if (self.currentSample.nextSampleId) {
                        return $url.formatUri(paths.site.ngRoutes.citizenScience.listen, {sampleNum: self.currentSample.nextSampleId});
                    } else {
                        return "";
                    }
                };

                // reverse binding of this functions to make
                // them accessible to the parent controller for autoplay
                self.nextLink = $scope.nextLink;

                self.progressNav = true;

            }],
        bindings: {
            audioElementModel: "=",
            currentSample: "=",
            numViewed: "=numViewed",
            nextLink: "="
        }
    });