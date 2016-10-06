angular.module("bawApp.components.progress", [])
    .component("datasetProgress",{
        templateUrl: "citizenScience/datasetProgress/datasetProgress.tpl.html",
        controller: ["$scope", function ($scope) {
            //console.log("dataset progress component scope");console.log($scope);

            var self = this;
            $scope.selectItem = function (itemNum) {
                self.selected = itemNum;
            };

        }],
        bindings: {
            items: "=items",
            selected: "=selected"
        }
    });