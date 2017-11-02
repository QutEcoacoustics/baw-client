angular.module("bawApp.components.progress", ["bawApp.citizenScience.csApiMock"])
    .component("datasetProgress",{
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams","$url", "conf.paths","CsApi", function ($scope, $routeParams,$url,paths,CsApi) {
            //console.log("dataset progress component scope");console.log($scope);

            console.log($routeParams);

            var self = this;
            $scope.selectItem = function (itemId) {
                console.log("selecting item", itemId);
                CsApi.getSample(itemId).then(function (apiResponse) {
                    self.currentSample = apiResponse;
                });
                console.log("setting selected to ", itemId);
            };

            $scope.selectItem($routeParams.sampleNum);

            $scope.$watch($routeParams, function (newVal, oldVal) {
                console.log("route params changed from ", oldVal, "to", newVal);

                // call the api to get the sample based on the route params
                $scope.selectItem($routeParams.sampleNum);

            }, true);


            // $scope.nextItem = function () {
            //     if (self.selected < self.items.length - 1) {
            //         self.selected = self.selected + 1;
            //     }
            // };
            //
            // $scope.prevItem = function () {
            //     if (self.selected > 0) {
            //         self.selected = self.selected - 1;
            //     }
            // };

            //TODO: this gets called constantly while the audio is playing
            /**
             * returns a link for routing based on the selected sample
             * Samples are 0 indexed, urls are 1 indexed.
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



            self.progressNav = true;

        }],
        bindings: {
            currentSample: "=",
            numViewed: "=numViewed"
        }
    });