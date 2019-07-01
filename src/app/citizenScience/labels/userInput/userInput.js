



angular.module("bawApp.components.citizenScienceUserInput",
    [
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceUserInput", {
        templateUrl: "citizenScience/labels/userInput/userInput.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            function ($scope, SampleLabels) {

                $scope.questionData = SampleLabels.data;
                $scope.questionDefinition = SampleLabels.question;

                // $scope.$watch(() => { return SampleLabels.getFields(); }, (newVal, oldVal) => {
                //     if (angular.isArray(newVal)) {
                //
                //         $scope.fieldDefinitions = newVal;
                //
                //         newVal.forEach(f => {
                //             $scope.fields[f.name] = "";
                //         });
                //
                //         // i want this to be assign by reference...but I don't think it is
                //         SampleLabels.data.fields = $scope.fields;
                //     }
                // }, true);


                // $scope.$watch("fields", function (newVal, oldVal) {
                //     SampleLabels.setFieldValues($scope.fields);
                // }, true);





            }],
        bindings: {
        }
    });