angular.module("bawApp.components.citizenScienceTextLabels",
    [
        "bawApp.components.citizenScienceTextLabels.label",
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceTextLabels", {
        templateUrl: "citizenScience/labels/textLabels/labels.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            function ($scope, SampleLabels) {
                //console.log("dataset progress component scope");console.log($scope);

                var self = this;

                console.log(self);


            }],
        bindings: {
            labels: "=labels"
        }
    });