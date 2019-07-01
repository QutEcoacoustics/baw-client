angular.module("bawApp.components.citizenScienceTextLabels",
    [
        "bawApp.components.citizenScienceTextLabels.label",
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceTextLabels", {
        templateUrl: "citizenScience/labels/textLabels/labels.tpl.html",
        controller: [
            "onboardingService",
            function (onboardingService) {


                onboardingService.addSteps([
                    {
                        element: "label-check:first-of-type div",
                       // TODO: fix this
                       // intro: `Make your selection about whether ${this.labels[0].name} is in the recording`,
                        intro: `Make your selection about whether this thing is in the recording`,
                        order: 5
                    }

                ]);


            }],
        bindings: {
            labels: "=labels"
        }
    });