angular.module("bawApp.components.citizenScienceThumbLabels",
    [
        "bawApp.components.citizenScienceThumbLabels.label"
    ])
    .component("citizenScienceLabels", {
        templateUrl: "citizenScience/thumbLabels/labels.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            function ($scope, $http, CitizenScienceCommon) {


            }],
        bindings: {
            labels: "=labels",
        }
    });