angular.module("bawApp.components.citizenScienceExamples", ["bawApp.citizenScience.common","bawApp.components.citizenScienceExample"])
    .component("citizenScienceExamples", {
        templateUrl: "citizenScience/examples/citizenScienceExamples.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            function ($scope, $http, CitizenScienceCommon) {
                //console.log("dataset progress component scope");console.log($scope);

                var self = this;

                /**
                 * if the label is already in the list of labels for this sample, remove it
                 * otherwise add it. Send the new set of labels to the dataset
                 * Note, we can't guarantee the order that the api calls will reach the google sheet.
                 * if the user adds and removes a label in quick succession, they might arrive out of order
                 * resulting in the wrong labels being applied.
                 * @param label string
                 */
                $scope.showExample = function (exampleNum) {

                    console.log(self);


                };

            }],
        bindings: {
            labels: "=labels",
            samples: "=samples",
            currentSampleNum: "=currentSampleNum",
            csProject: "=csProject"
        }
    });