angular.module("bawApp.components.citizenScienceLabelCheck", ["bawApp.citizenScience.common"])
    .component("labelCheck", {
        templateUrl: "citizenScience/textLabels/labelCheck.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            function ($scope, $http, CitizenScienceCommon) {

                //console.log("dataset progress component scope");console.log($scope);

                var self = this;

                /**
                 * Add or remove the label num to the list of selected labels for this sample
                 * Send the new set of labels to the dataset
                 * Note, we can't guarantee the order that the api calls will reach the google sheet.
                 * if the user adds and removes a label in quick succession, they might arrive out of order
                 * resulting in the wrong labels being applied.
                 * @param label string
                 */
                $scope.toggleLabel = function (labelNum) {

                    var currentSample = self.samples[self.currentSampleNum];

                    currentSample.labels[labelNum] = !currentSample.labels[labelNum];

                    currentSample.done = true;

                    var tags = self.labels.filter(function (value, index) {
                        return currentSample.labels[index];
                    }).map(function (value) {
                        return value.tags;
                    });

                    var url = CitizenScienceCommon.apiUrl("setLabels",
                        self.csProject,
                        currentSample.name,
                        currentSample.recordingId,
                        currentSample.startOffset,
                        CitizenScienceCommon.labelsAsString(tags));
                    $http.get(url).then(function (response) {
                        console.log(response.data);
                    });

                };

                /**
                 * Whether the label has been attached to the current sample
                 * @param label Object
                 * @returns Boolean
                 */
                $scope.labelSelected = function () {
                    if(self.currentSampleNum === -1) {
                        return false;
                    }
                    var currentSample = self.samples[self.currentSampleNum];

                    return currentSample.labels[self.label.labelNumber];

                };


            }],
        bindings: {
            label: "=",
            samples: "=",
            currentSampleNum: "=",
            csProject: "="
        }
    });