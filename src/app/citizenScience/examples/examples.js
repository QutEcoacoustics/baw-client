angular.module("bawApp.components.citizenScienceExamples", ["bawApp.citizenScience.common","bawApp.components.citizenScienceExample"])
    .component("citizenScienceExamples", {
        templateUrl: "citizenScience/examples/citizenScienceExamples.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            function ($scope, $http, CitizenScienceCommon) {


                var self = this;

                $scope.changeCurExample = function (labelNum, changeBy) {
                    var l = self.labels[labelNum].examples.length;
                    self.labels[labelNum].curExample = ((self.labels[labelNum].curExample + changeBy % l) + l) % l;
                    console.log("changed cur example for label " + labelNum + " to " + self.labels[labelNum].curExample);
                };


                /**
                 * Initialize current example for all labels
                 */
                self.labels.forEach(function (label, index) {

                    if (label.examples.length) {
                        label.curExample = 0;
                    } else {
                        label.curExample = -1;
                    }

                });


            }],
        bindings: {
            labels: "=labels",
        }
    });