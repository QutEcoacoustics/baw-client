angular.module("bawApp.components.progress", [])
    .component("datasetProgress",{
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", function ($scope) {
            //console.log("dataset progress component scope");console.log($scope);

            var self = this;
            $scope.selectItem = function (itemNum) {
                self.selected = itemNum;
            };

            $scope.nextItem = function () {
                if (self.selected < self.items.length - 1) {
                    self.selected = self.selected + 1;
                }
            };

            $scope.prevItem = function () {
                if (self.selected > 0) {
                    self.selected = self.selected - 1;
                }
            };

            /**
             * Returns the number of viewed items
             * @returns {number}
             */
            $scope.numViewed = function () {
                return self.items.reduce((prev, cur) => prev + (cur.done ? 1 : 0), 0);
            };

            self.progressNav = true;

        }],
        bindings: {
            items: "=items",
            selected: "=selected"
        }
    });