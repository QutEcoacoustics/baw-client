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
                $scope.label = self.labels[0].name;

                $scope.isSelectedPositive = function() {
                    return SampleLabels.getValue() === 1;
                };

                /**
                 * callback when this label is either attached or detached from the current sample
                 * @param value Boolean
                 */
                $scope.setValue = function (value) {
                    SampleLabels.setValue(value);
                };

            }],
        bindings: {
            labels: "=",
        }
    });