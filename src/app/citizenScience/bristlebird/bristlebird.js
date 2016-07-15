class BristlebirdController {
    constructor($scope, $routeParams) {

        var self = this;

        $scope.samples = [
            {
                "recordingId": "0123456",
                "startOffset": "123",
                "done": 0
            },
            {
                "recordingId": "1234567",
                "startOffset": "234",
                "done": 0
            },
            {
                "recordingId": "2345678",
                "startOffset": "345",
                "done": 0
            },
            {
                "recordingId": "3456789",
                "startOffset": "456",
                "done": 0
            },
            {
                "recordingId": "4567890",
                "startOffset": "567",
                "done": 0
            }
        ];

        $scope.sampleDuration = 10;

        /**
         * Sets the current sample to sampleNum
         * @param sample_num int the index of the samples array of json objects
         */
        $scope.goToSample = function (sampleNum) {
            $scope.currentSample = sampleNum;
        };

        $scope.$watch("currentSample", function () {

            console.log("load audio for sample "+ $scope.currentSample);

        });



        /**
         * Sets the current sample found to true then moves to the next sample
         */
        $scope.found = function () {
            $scope.samples[$scope.currentSample].found = true;
            self.done();

        };

        /**
         * Sets the current sample found to false then moves to the next sample
         */
        $scope.notFound = function () {
            $scope.samples[$scope.currentSample].found = false;
            self.done();
        };

        /**
         * Sets the current sample to 'done' and moves to the next sample
         */
        this.done = function () {
            $scope.samples[$scope.currentSample].done = true;
            $scope.goToSample($scope.currentSample + 1);
        };

        $scope.goToSample(0);


    }




}

angular
    .module("bawApp.citizenScience.bristlebird", ["bawApp.components.progress"])
    .controller(
        "BristlebirdController",
        [
            "$scope",
            "$routeParams",
            BristlebirdController
        ]);
