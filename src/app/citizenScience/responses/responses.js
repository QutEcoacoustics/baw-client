/* This controls the screen where all responses are listed for admin */
class ResponsesController {
    constructor($scope,
                SampleLabels,
                Question) {


    }
}


angular
    .module("bawApp.citizenScience.responses", [
        "bawApp.citizenScience.sampleLabels"
    ])
    .controller(
        "ResponsesController",
        [
            "$scope",
            "SampleLabels",
            "Question",
            ResponsesController
        ]);