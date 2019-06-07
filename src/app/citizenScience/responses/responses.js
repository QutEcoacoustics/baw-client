/* This controls the screen where all responses are listed for admin */
class ResponsesController {
    constructor($scope,
                SampleLabels,
                Question) {

        var self = this;

        // todo: display table of responses.

        console.log(self);


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