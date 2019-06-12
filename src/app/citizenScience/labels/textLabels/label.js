angular.module("bawApp.components.citizenScienceTextLabels.label",
    [
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceTextLabel", {
        templateUrl: "citizenScience/labels/textLabels/label.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            function ($scope, SampleLabels) {

                var self = this;

                $scope.isSelected = function() {
                    return SampleLabels.getValue(self.label.id);
                };

                /**
                 * callback when this label is either attached or detached from the current sample
                 * @param isSelected Boolean
                 */
                self.onToggleSelected = function (isSelected) {
                    SampleLabels.setValue(isSelected, self.label.id);
                };

            }],
        bindings: {
            label: "=",
        }
    });