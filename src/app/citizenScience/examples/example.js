angular.module("bawApp.components.citizenScienceExample", ["bawApp.citizenScience.common"])
    .component("citizenScienceExample", {
        templateUrl: "citizenScience/examples/citizenScienceExample.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            function ($scope, $http, CitizenScienceCommon) {
                //console.log("dataset progress component scope");console.log($scope);

                console.log("hello example");




            }],
        bindings: {
            label: "=label"
        }
    });