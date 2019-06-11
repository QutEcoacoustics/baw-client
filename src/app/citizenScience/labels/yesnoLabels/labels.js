angular.module("bawApp.components.citizenScienceYesnoLabels",
    [
    ])
    .component("citizenScienceYesnoLabels", {
        templateUrl: "citizenScience/labels/yesnoLabels/labels.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            function ($scope, SampleLabels) {

                var self = this;
                // yesno questions only have one label
                $scope.label = self.questionData.labels[0].name;

                // binary can have 3 statuses: selected yes, selected no or not selected

                $scope.isSelected = function() {
                    return SampleLabels.getValue(self.label.id);
                };

                /**
                 * callback when this label is either attached or detached from the current sample
                 * @param isSelected Boolean
                 */
                self.onToggleSelected = function (isSelected) {
                    SampleLabels.setValue(self.label.id, isSelected);
                };


            }],
        bindings: {
            questionData: "=",
        }
    });