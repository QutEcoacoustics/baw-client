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

                //was : $scope.isSelected = function() {
                // $scope.currentState = function() {
                //     return SampleLabels.getValue(self.label.id);
                // };

                $scope.state = "empty";


                $scope.$watch("state", function (newVal, oldVal) {
                    console.log(newVal);
                    SampleLabels.setValue($scope.state, self.label.id);
                });

                /**
                 * callback when this label state changes
                 * This is used to get reverse binding into transcluded components.
                 * @param isSelected Boolean
                 */
                self.onToggleSelected = function (state) {
                    SampleLabels.setValue(state, self.label.id);
                    $scope.state = state;
                };



            }],
        bindings: {
            label: "=",
        }
    });