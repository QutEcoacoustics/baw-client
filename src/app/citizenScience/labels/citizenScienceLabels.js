var csLabels = angular.module("bawApp.citizenScience.csLabels", [
    "bawApp.citizenScience.common",
    "bawApp.components.citizenScienceThumbLabels",
    "bawApp.components.citizenScienceTextLabels",
    "bawApp.citizenScience.sampleLabels",
    "bawApp.components.citizenScienceUserInput"
]);


csLabels.component("citizenScienceLabels", {
        templateUrl: "citizenScience/labels/labels.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            function ($scope, SampleLabels) {


                $scope.question = SampleLabels.question;

                /**
                 * When the labels are updated (question data retrieved from the server)
                 * set up the labels and userInput UI
                 */
                $scope.$watch(SampleLabels.getLabels, function (newVal, oldVal) {

                    if (typeof(newVal) === "object") {
                        if (newVal === 1) {
                            $scope.labelType = "yesno";
                        } else if (newVal.length > 0 &&
                            newVal.every(l => l.hasOwnProperty("examples") && l.examples.length > 0 )) {
                            // if all labels have an example
                            $scope.labelType = "thumb";
                        } else {
                            // this is not yet implemented but should be just a list of checkboxes next to the label text string
                            $scope.labelType = "text";
                        }


                        // // assume that when labels change fields also changes.
                        // $scope.fields = SampleLabels.getFields();

                        $scope.labels = newVal;
                    }

                }, true);



            }],
        bindings: {
        }
    });


