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

                $scope.selected = function () {
                    return self.selectedLabelNum.value === self.labelNum;
                };


                $scope.toggleSelected = function () {

                    console.log("toggling state for label number", self.labelNum);

                    console.log("old selected label num:", self.selectedLabelNum.value);

                    //$scope.selected = self.onToggleSelected(self.labelNum);

                    if (self.selectedLabelNum.value === self.labelNum) {
                        self.selectedLabelNum.value = -1;
                    } else {
                        self.selectedLabelNum.value = self.labelNum;
                        $scope.$emit("examples-position", ($element[0].offsetTop));
                    }

                    console.log("new selected label num:", self.selectedLabelNum.value);


                };

            }],
        bindings: {

            labelNum: "<",

            label: "=",

            onToggleSelected: "<",

            selectedLabelNum: "="


        }
    });