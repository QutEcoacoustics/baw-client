



angular.module("bawApp.components.citizenScienceUserInput",
    [
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceUserInput", {
        templateUrl: "citizenScience/labels/userInput/userInput.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            "onboardingService",
            function ($scope, SampleLabels, onboardingService) {

                $scope.questionData = SampleLabels.data;
                $scope.questionDefinition = SampleLabels.question;

                onboardingService.waitFor("questions");

                $scope.$watch(() => SampleLabels.question.fields.length, (newVal) => {

                    if (newVal > 0) {
                        var stepsToAdd = SampleLabels.question.fields.map((field, i) => {
                            return {
                                element: `.label-user-input:nth-of-type(${i + 1})`,
                                intro: `Input ${field.name} for this audio clip`,
                                order: 6
                            };
                        });

                        onboardingService.addSteps(stepsToAdd);

                    }

                }, true);

            }],
        bindings: {
        }
    });