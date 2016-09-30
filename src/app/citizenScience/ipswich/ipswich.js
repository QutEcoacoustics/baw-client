class IpswichController {
    constructor($scope,
                $routeParams,
                $http,
                ngAudioEvents,
                AudioRecording,
                Media,
                MediaModel,
                UserProfile,
                UserProfileEvents,
                CitizenScienceCommon) {

        var self = this;

        self.csProject = "ipswich";

        $scope.citizenScientistName = $routeParams.name;

        // currently all samples will be the same duration (not set per sample in the dataset)
        self.sampleDuration = 10;


        // list of the samples, to be retrieved from the dataset
        $scope.samples = [];
        $scope.currentSample = -1;


        // to be populated after getting samples from dataset
        $scope.media = null;

        // list of labels that can be applied to samples
        $scope.labels = [];

        $http.get(CitizenScienceCommon.apiUrl(
            "labels",
            self.csProject
        )).then(function (response) {
            console.log(response.data);
            $scope.labels = response.data;
        });

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
         *      "labels": ["frog","bird"]
         *  },
         *  {
         *      "name": "phil",
         *      "recordingId": "1234567",
         *      "startOffset": "234",
         *      "done": 0,
         *      "labels": ["frog","bird","cat"]
         *  };
         */
        var url = CitizenScienceCommon.apiUrl("userSamples", self.csProject, $scope.citizenScientistName);
        //TODO: error handling
        $http.get(url).then(function (response) {
            //console.log(response.data);
            var samples = response.data;
            $scope.samples = samples;
            $scope.goToSample(0);
        });




        // the model passed to ngAudio
        $scope.model = {
            audioElement: CitizenScienceCommon.getAudioModel()
        };








        /**
         * Sets the media member of the scope to the specified recording segment
         * The watcher will then actually load it to the dom
         * @param recordingId string
         * @param startOffset float
         * @param duration float
         */
        this.showAudio = function (recordingId, startOffset, duration) {

            var mediaParams = {
                recordingId: recordingId,
                startOffset: startOffset,
                endOffset: startOffset + duration,
                format: "json"};

            Media.get(
                mediaParams,
                function (mediaValue) {
                    $scope.media = new MediaModel(mediaValue.data);
                },
                function () { console.log("fail"); } // failure
            );

            // do not block, do not wait for Media requests to finish
            return;

        };


        /**
         * Sets the current sample to sampleNum
         * @param sample_num int the index of the samples array of json objects
         */
        $scope.goToSample = function (sampleNum) {
            if (sampleNum < $scope.samples.length) {
                $scope.currentSample = sampleNum;
            } else {
                console.log("can't go to next sample because this is the last one");
            }

        };

        $scope.$watch("currentSample", function () {
            if ($scope.currentSample > -1) {
                console.log("load audio for sample " + $scope.currentSample);
                var currentSample = $scope.samples[$scope.currentSample];
                self.showAudio(currentSample.recordingId,currentSample.startOffset, self.sampleDuration);
            }
        });

        // reload audio when the source changes. Without this it won't change the audio
        // even though the src attribute changes
        $scope.$watch("media", function () {
            document.querySelector("audio").load();
        });



        /**
         * auto play feature
         * when the playback arrives at the end of the audio, it will assume
         * that nothing of interest has been found and proceed to the next segment.
         */
        $scope.$on(ngAudioEvents.ended, function navigate(event) {
            console.info("Changing page to next segment...");
            self.done(false);
        });

    }

}


angular
    .module("bawApp.citizenScience.ipswich", [
        "bawApp.components.progress",
        "bawApp.citizenScience.common",
        "bawApp.components.citizenScienceLabels"
    ])
    .controller(
        "IpswichController",
        [
            "$scope",
            "$routeParams",
            "$http",
            "ngAudioEvents",
            "AudioRecording",
            "Media",
            "baw.models.Media",
            "UserProfile",
            "UserProfileEvents",
            "CitizenScienceCommon",
            IpswichController
        ]);
