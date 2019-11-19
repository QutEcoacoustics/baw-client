angular.module("bawApp.components.citizenScienceTextLabels",
    [
        "bawApp.components.citizenScienceTextLabels.label",
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceTextLabels", {
        templateUrl: "citizenScience/labels/textLabels/labels.tpl.html",
        controller: [
            "$scope",
            "onboardingService",
            function ($scope, onboardingService) {

                var self = this;

                $scope.$watch(() => self.labels, (newVal) => {
                    if (self.labels.length > 0) {
                        onboardingService.addSteps([
                            {
                                element: "label-check:first-of-type div",
                                intro: `Make your selection about whether ${this.labels[0].name} is in the recording`,
                                order: 5
                            }

                        ], "questions");
                    }
                });

            }],
        bindings: {
            labels: "=labels"
        }
    });