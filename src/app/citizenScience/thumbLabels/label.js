angular.module("bawApp.components.citizenScienceThumbLabels.label",
    [
        "bawApp.components.citizenScienceThumbLabels.examples"
    ])
    .component("citizenScienceLabel", {
        templateUrl: "citizenScience/thumbLabels/label.tpl.html",
        controller: [
            "$scope",
            "$element",
            function ($scope, $element) {

                var self = this;

                $scope.selected = { value: false };

                $scope.isShowingDetails = function () {
                    return self.currentDetailsLabelNum.value === self.label.labelNumber;
                };

                /**
                 * toggles whether the details pane is showing for the current label
                 */
                $scope.toggleShowDetails = function () {
                    console.log("one");
                    if ($scope.isShowingDetails()) {
                        self.currentDetailsLabelNum.value = -1;
                    } else {
                        self.currentDetailsLabelNum.value = self.label.labelNumber;
                    }
                    console.log("showing details for label num:", self.currentDetailsLabelNum.value);
                };

                /**
                 * callback when this label is either attached or detached from the current sample
                 * @param isSelected Boolean
                 */
                self.onToggleSelected = function (isSelected) {
                    console.log("label ", self.label.name, "selected value for sample x set to", isSelected);
                    $scope.$emit("label-toggle", self.label.labelNumber, isSelected);

                };

                $scope.$on("update-selected-labels", function (e, labelSelections) {
                    $scope.selected.value = labelSelections[self.label.labelNumber];
                });

            }],
        bindings: {

            label: "=",
            currentDetailsLabelNum: "=",

        }
    });