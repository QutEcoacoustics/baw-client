angular.module("bawApp.components.citizenScienceThumbLabels",
    [
        "bawApp.components.citizenScienceThumbLabels.label"
    ])
    .component("citizenScienceLabels", {
        templateUrl: "citizenScience/yesnoLabels/labels.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            "annotationLibraryCommon",
            "baw.models.AudioEvent",
            "$q",
            function ($scope) {

                var self = this;
                // yesno questions only have one label
                $scope.label = questionData.labels[0].name

            }],
        bindings: {
            questionData: "=",
        }
    });