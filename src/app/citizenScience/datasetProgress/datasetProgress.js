angular.module("bawApp.components.progress", ["bawApp.citizenScience.csApiMock"])
    .component("datasetProgress",{
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams","$url", "conf.paths","CsApi","SampleLabels",
            function ($scope, $routeParams,$url,paths,CsApi,SampleLabels) {

            var self = this;
            $scope.selectItem = function (itemId) {
                console.log("selecting item", itemId);
                CsApi.getSample(itemId).then(function (apiResponse) {
                    self.currentSample = apiResponse;
                });

                $scope.totalSamplesViewed = SampleLabels.getNumSamplesViewed();

                console.log("setting selected to ", itemId);
            };

            $scope.selectItem($routeParams.sampleNum);

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

            //TODO: this gets called constantly while the audio is playing
            /**
             * returns a link for routing based on the id for the next and
             * previous samples. That id is returned in the request for metadata of
             * the current sample (contained in the route).
             * @returns string
             */
            $scope.previousLink = function () {
                if (self.currentSample.previousSampleId) {
                    return $url.formatUri(paths.site.ngRoutes.citizenScience.listen, {sampleNum:self.currentSample.previousSampleId});
                } else {
                    return "";
                }
            };
            $scope.nextLink = function () {
                if (self.currentSample.nextSampleId) {
                    return $url.formatUri(paths.site.ngRoutes.citizenScience.listen, {sampleNum:self.currentSample.nextSampleId});
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