angular.module("bawApp.components.citizenScienceLabels", ["bawApp.citizenScience.common"])
    .component("citizenScienceLabels", {
        templateUrl: "citizenScience/labels/citizenScienceLabels.tpl.html",
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
                $scope.toggleLabel = function (label) {
                    var index = self.samples[self.currentSampleNum].labels.indexOf(label);

                    var currentSample = self.samples[self.currentSampleNum];

                    if (index === -1) {
                        currentSample.labels.push(label);
                    } else {
                        currentSample.labels.splice(index, 1);
                    }

                    currentSample.done = true;



                    var url = CitizenScienceCommon.apiUrl("setLabels",
                        self.csProject,
                        currentSample.name,
                        currentSample.recordingId,
                        currentSample.startOffset,
                        CitizenScienceCommon.labelsAsString(currentSample.labels));
                    $http.get(url).then(function (response) {
                        console.log(response.data);
                    });

                };

            }],
        bindings: {
            labels: "=labels",
            samples: "=samples",
            currentSampleNum: "=currentSampleNum",
            csProject: "=csProject"
        }
    });