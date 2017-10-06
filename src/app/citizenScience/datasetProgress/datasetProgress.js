angular.module("bawApp.components.progress", [])
    .component("datasetProgress",{
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", "$routeParams","$url", "conf.paths", function ($scope, $routeParams,$url,paths) {
            //console.log("dataset progress component scope");console.log($scope);

            console.log($routeParams);

            var self = this;
            $scope.selectItem = function (itemNum) {
                console.log("selecting item", itemNum - 1);
                self.selected = itemNum - 1;
                console.log("setting selected to ", self.selected);
            };

            $scope.selectItem($routeParams.sampleNum);

            $scope.$watch($routeParams, function (newVal, oldVal) {
                console.log("route params changed from ", oldVal, "to", newVal);
                self.selected = newVal - 1;
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
                if (self.selected > 0) {
                    return $url.formatUri(paths.site.ngRoutes.citizenScience.listen, {sampleNum:self.selected});
                } else {
                    return "";
                }
            };
            $scope.nextLink = function () {
                if (self.selected < self.items.length - 1) {
                    return $url.formatUri(paths.site.ngRoutes.citizenScience.listen, {sampleNum:self.selected + 2});
                } else {
                    return "";
                }
            };



            self.progressNav = true;

        }],
        bindings: {
            previousSample: "=",
            currentSample: "=",
            nextSample: "=",
            numViewed: "=numViewed"
        }
    });