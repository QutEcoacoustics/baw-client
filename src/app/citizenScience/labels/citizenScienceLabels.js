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
                    var index = self.samples[self.currentSample].labels.indexOf(label);
                    if (index === -1) {
                        self.samples[self.currentSample].labels.push(label);
                    } else {
                        self.samples[self.currentSample].labels.splice(index, 1);
                    }

                    self.samples[self.currentSample].done = true;

                    var url = CitizenScienceCommon.apiUrl("setLabels",
                        self.csProject,
                        self.samples[self.currentSample].name,
                        self.samples[self.currentSample].recordingId,
                        self.samples[self.currentSample].startOffset,
                        CitizenScienceCommon.labelsAsString(self.samples[self.currentSample].labels));
                    $http.get(url).then(function (response) {
                        console.log(response.data);
                    });

                };

            }],
        bindings: {
            labels: "=labels",
            samples: "=samples",
            currentSample: "=currentSample",
            csProject: "=csProject"
        }
    });