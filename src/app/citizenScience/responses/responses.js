class ResponsesController {
    constructor($scope,
                SampleLabels,
                CsLabels) {

        var self = this;

        SampleLabels.init("ebb");

        self.labels = false;

        CsLabels.getLabels("ebb").then(labels => {
            $scope.responseData = SampleLabels.getData(labels);
            self.labels = labels;
        });




        $scope.$watch("responseData", function (newVal, oldVal) {
            $scope.responseDataString = JSON.stringify(newVal, null, 4);
        },true);

        $scope.deleteResponses = function () {
            if (confirm("Are you sure you want to delete all the responses?")) {
                SampleLabels.clearLabels();
                CsLabels.getLabels("ebb").then(labels => {
                    $scope.responseData = SampleLabels.getData(labels);
                    self.labels = labels;
                });
            }
        };




    }
}


angular
    .module("bawApp.citizenScience.responses", [
        "bawApp.citizenScience.sampleLabels",
        "bawApp.citizenScience.csLabels"
    ])
    .controller(
        "ResponsesController",
        [
            "$scope",
            "SampleLabels",
            "CsLabels",
            ResponsesController
        ]);