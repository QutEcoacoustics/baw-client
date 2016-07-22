class BristlebirdController {
    constructor($scope, $routeParams, $http) {

        var self = this;
        self.sheets_api_url = "http://localhost:8081";

        // list of the samples, to be retrieved from the dataset
        $scope.samples = [];
        $scope.citizenScientistName = $routeParams.name;

        // currently all samples will be the same duration (not set per sample in the dataset)
        $scope.sampleDuration = 10;

        /**
         * Sets the current sample to 'done'
         * sends the info to the dataset
         * and moves to the next sample
         * @param isFound boolean whether a bird was found or not
         */
        this.done = function (isFound) {
            $scope.samples[$scope.currentSample].found = true;
            $scope.samples[$scope.currentSample].done = true;
            var url = this.apiUrl((isFound) ? "found" : "notfound", $scope.samples[$scope.currentSample].name,
                $scope.samples[$scope.currentSample].recordingId,
                $scope.samples[$scope.currentSample].startOffset);
            $http.get(url).then(function (response) {
                console.log(response.data);
            });
            $scope.goToSample($scope.currentSample + 1);
        };

        /**
         * Constructs a url for the api by concatenating url/arg1/arg2/arg3 etc
         */
        this.apiUrl = function () {
             // convert to array
            var args = Array.prototype.slice.call(arguments);
            return [self.sheets_api_url].concat(args).join("/");
        };

        /**
         *  makes a request to the external sheets api to get the data
         *  is formatted in the following way:
         *
         *  samples = [
         *  {
         *      "name": "phil"
         *      "recordingId": "0123456",
         *      "startOffset": "123",
         *      "done": 0,
         *      "found": 0
         *  },
         *  {
         *      "name": "phil",
         *      "recordingId": "1234567",
         *      "startOffset": "234",
         *      "done": 0,
         *      "found": 0
         *  };
         */
        var url = this.apiUrl("userSamples", $scope.citizenScientistName);
        //TODO: error handling
        $http.get(url).then(function (response) {
            //console.log(response.data);
            var samples = response.data;
            console.log(samples);
            $scope.samples = samples;
        });


        /**
         * Sets the current sample to sampleNum
         * @param sample_num int the index of the samples array of json objects
         */
        $scope.goToSample = function (sampleNum) {
            $scope.currentSample = sampleNum;
        };

        $scope.$watch("currentSample", function () {

            console.log("load audio for sample "+ $scope.currentSample);

            // var audioItem = {}; // TODO: add relevant audio item info e.g. recording id

            //libraryCommon.addCalculatedProperties(audioItem); // adds in things like the url to the audio item. See app/AnnotationLibrary/item.js

        });


        /**
         * Sets the current sample found to true then moves to the next sample
         */
        $scope.found = function () {
            self.done(true);

        };

        /**
         * Sets the current sample found to false then moves to the next sample
         */
        $scope.notFound = function () {
            self.done(false);
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
            "$http",
            BristlebirdController
        ]);
