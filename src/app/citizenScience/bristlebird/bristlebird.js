class BristlebirdController {
    constructor($scope, $routeParams) {

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
         * Sets th
         * @param sample_num int the index of the samples array of json objects
         */
        $scope.goToSample = function (sampleNum) {

            $scope.currentSample = sampleNum;
            console.log(sampleNum);

        };



        /**
         * Sets whether a bird was found in the current sample
         * increments the current sample
         * @param found boolean
         */
        $scope.found = function (found) {
            $scope.samples[$scope.currentSample].found = found;
            $scope.samples[$scope.currentSample].done = true;
            $scope.goToSample($scope.currentSample + 1);
        };

        $scope.goToSample(0);


    }




}

angular
    .module("bawApp.citizenScience.bristlebird", [])
    .controller(
        "BristlebirdController",
        [
            "$scope",
            "$routeParams",
            BristlebirdController
        ]);
