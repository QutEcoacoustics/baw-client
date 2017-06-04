angular.module("bawApp.components.citizenScienceLabelCheck", ["bawApp.citizenScience.common"])
    .component("labelCheck", {
        templateUrl: "citizenScience/textLabels/labelCheck.tpl.html",
        controller: [
            "$scope",
            function ($scope) {


                var self = this;
                console.log("label check box for label ", self.label);


                // /**
                //  * Whether the label has been attached to the current sample
                //  */
                // $scope.isChecked = false;
                //
                /**
                 * Add or remove the label num to the list of selected labels for this sample
                 * Send the new set of labels to the dataset
                 * Note, we can't guarantee the order that the api calls will reach the google sheet.
                 * if the user adds and removes a label in quick succession, they might arrive out of order
                 * resulting in the wrong labels being applied.
                 * @param label string
                 */
                $scope.toggleLabel = function () {
                    //$scope.isChecked = !$scope.isChecked;
                    //self.onToggle($scope.isChecked);
                    self.checked.value = !self.checked.value;
                    self.onToggleSelected(self.checked.value);
                };


            }],
        bindings: {
            checked: "=",
            onToggleSelected: "=",
            text:"<"
        }
    });