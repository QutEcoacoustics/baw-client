angular.module("bawApp.components.citizenScienceLabelCheck", ["bawApp.citizenScience.common"])
    .component("labelCheck", {
        templateUrl: "citizenScience/textLabels/labelCheck.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                var self = this;

                /**
                 * Add or remove the label num to the list of selected labels for this sample
                 * Send the new set of labels to the dataset
                 * @param label string
                 */
                $scope.toggleLabel = function () {
                    self.onToggleSelected(!self.isChecked());
                };

            }],
        bindings: {
            isChecked: "=",
            onToggleSelected: "=",
            text:"<",
        }
    });