angular.module("bawApp.components.citizenScienceThumbLabels.label",
    [
        "bawApp.components.citizenScienceThumbLabels.examples",
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceLabel", {
        templateUrl: "citizenScience/thumbLabels/label.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            function ($scope, SampleLabels) {

                /**
                 * A label is "selected" if it has been applied to the current sample
                 * A label is "active" if it has been clicked to show details
                 */

                var self = this;

                $scope.isSelected = function() {
                    return SampleLabels.getValue(null, self.label.id);
                };

                $scope.isShowingDetails = function () {
                    return self.currentDetailsLabelId.value === self.label.id;
                };

                /**
                 * toggles whether the details pane is showing for the current label
                 */
                $scope.toggleShowDetails = function () {
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
                    SampleLabels.setValue(null, self.label.id, isSelected);
                };

            }],
        bindings: {

            label: "=",
            currentDetailsLabelId: "=",

        }
    });