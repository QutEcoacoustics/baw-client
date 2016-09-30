angular.module("bawApp.components.citizenScienceLabels", ["bawApp.citizenScience.common"])
    .component("citizenScienceLabels",{
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
                var index = $scope.samples[$scope.currentSample].labels.indexOf(label);
                if (index === -1) {
                    $scope.samples[$scope.currentSample].labels.push(label);
                } else {
                    $scope.samples[$scope.currentSample].labels.splice(index,1);
                }

                var url = CitizenScienceCommon.apiUrl("setLabels",
                    self.csProject,
                    $scope.samples[$scope.currentSample].name,
                    $scope.samples[$scope.currentSample].recordingId,
                    $scope.samples[$scope.currentSample].startOffset,
                    $scope.samples[$scope.currentSample].labels.join(","));
                $http.get(url).then(function (response) {
                    console.log(response.data);
                });


            };

        }],
        bindings: {
            labels: "=labels",
            samples: "=samples",
            currentSample: "=currentSample"
        }
    });