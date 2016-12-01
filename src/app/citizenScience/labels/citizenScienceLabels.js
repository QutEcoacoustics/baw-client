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

                    var currentSample = self.samples[self.currentSampleNum];
                    var index = self.indexOfArray(currentSample.labels, label.tags);

                    if (index === -1) {
                        currentSample.labels.push(label.tags);
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

                /**
                 * given an array of arrays "containingArray", and an array "arr",
                 * returns the index of containingArray that matches arr
                 */
                self.indexOfArray = function (containingArray, arr) {
                    var i,j,curSame;
                    arr = arr.sort();
                    for (i = 0; i < containingArray.length; i++) {
                        if(arr.length !== containingArray[i].length) {
                            continue;
                        }
                        containingArray[i] = containingArray[i].sort();
                        curSame = true;
                        for(j = arr.length; j--;) {
                            if(arr[j] !== containingArray[i][j]) {
                                curSame = false;
                                break;
                            }

                        }
                        if (curSame) {
                            return i;
                        }
                    }
                    return -1;
                };

                /**
                 * Whether the all tags in the label have been attached to the current sample
                 * @param label Object
                 * @returns Boolean
                 */
                $scope.labelSelected = function (label) {
                    if(self.currentSampleNum === -1) {
                        return false;
                    }
                    var currentSample = self.samples[self.currentSampleNum];
                    var index = self.indexOfArray(currentSample.labels, label.tags);
                    return (index > -1);
                };

            }],
        bindings: {
            labels: "=labels",
            samples: "=samples",
            currentSampleNum: "=currentSampleNum",
            csProject: "=csProject"
        }
    });