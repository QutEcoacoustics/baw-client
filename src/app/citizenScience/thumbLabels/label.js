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
                    return self.currentDetailsLabelId.value === self.label.id;
                };

                /**
                 * toggles whether the details pane is showing for the current label
                 */
                $scope.toggleShowDetails = function () {
                    console.log("one");
                    if ($scope.isShowingDetails()) {
                        self.currentDetailsLabelId.value = -1;
                    } else {
                        self.currentDetailsLabelId.value = self.label.id;
                    }
                    console.log("showing details for label:", self.currentDetailsLabelId.value);
                };

                /**
                 * callback when this label is either attached or detached from the current sample
                 * @param isSelected Boolean
                 */
                self.onToggleSelected = function (isSelected) {
                    console.log("label ", self.label.name, "selected value for sample x set to", isSelected);
                    $scope.$emit("label-toggle", self.label.id, isSelected);

                };

                $scope.$on("update-selected-labels", function (e, labelSelections) {
                    if (labelSelections[self.label.id] === undefined) {
                        $scope.selected.value = false;
                    } else {
                        $scope.selected.value = labelSelections[self.label.id].value;
                    }
                });

            }],
        bindings: {

            label: "=",
            currentDetailsLabelId: "=",

        }
    });