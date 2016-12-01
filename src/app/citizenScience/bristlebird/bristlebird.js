class BristlebirdAboutController {
    constructor($scope,
                $location) {

        $scope.citizenScientistName = "";

        $scope.getStarted = function () {
            localStorage.setItem("citizenScientistName", $scope.citizenScientistName);
            $location.path("/citsci/bristlebird/listen");
        };
    }
}


class BristlebirdController {
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

        $scope.csProject = "ebb";

        // currently all samples will be the same duration (not set per sample in the dataset)
        self.sampleDuration = 10;

        // list of the samples, to be retrieved from the dataset
        $scope.samples = [];
        $scope.currentSampleNum = -1;

        // to be populated after getting samples from dataset
        $scope.media = null;

        // list of labels that can be applied to samples
        // hardcoded here instead of retrieving from sheet to save a round trip
        // label key must exist the list in the sheet to be accepted
        //$scope.labels = {"ebb":"I found an Eastern Bristlebird"};


        // labels that have examples attached
        $scope.labels = [{
            "tags":["ebb","type1"],
            "label": "I found an Eastern Bristlebirdy",
            "example":{
                "recordingId":12121
            }
        }];

        self.getSamples = CitizenScienceCommon.bindGetSamples($scope);

        // the model passed to ngAudio
        $scope.model = {
            audioElement: CitizenScienceCommon.getAudioModel()
        };


        this.showAudio = CitizenScienceCommon.bindShowAudio($scope);


        /**
         * Sets the current sample to sampleNum
         * @param sample_num int the index of the samples array of json objects
         */
        $scope.goToSample = function (sampleNum) {
            if (sampleNum < $scope.samples.length) {
                $scope.currentSampleNum = sampleNum;
            } else {
                console.log("can't go to next sample because this is the last one");
            }

        };

        $scope.$watch("currentSampleNum", function () {
            if ($scope.currentSampleNum > -1) {
                console.log("load audio for sample "+ $scope.currentSampleNum);
                var currentSample = $scope.samples[$scope.currentSampleNum];
                self.showAudio(currentSample.recordingId, currentSample.startOffset, self.sampleDuration);
            }
        });

        // reload audio when the source changes. Without this it won't change the audio
        // even though the src attribute changes
        $scope.$watch("media", function () {
            document.querySelector("audio").load();
        });


        /**
         * auto play feature
         * when the playback arrives at the end of the audio, it will proceed to the next segment.
         */
        $scope.$on(ngAudioEvents.ended, function navigate(event) {
            var nextSampleNum = $scope.currentSampleNum + 1;
            console.info("Changing page to next segment, which is segment " + nextSampleNum);


            $scope.$safeApply($scope, function () {
                $scope.goToSample(nextSampleNum);
            });


        });

    }

}

angular
    .module("bawApp.citizenScience.bristlebird", [
        "bawApp.components.progress",
        "bawApp.citizenScience.common",
        "bawApp.components.citizenScienceLabels"
    ])
    .controller(
        "BristlebirdController",
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
            BristlebirdController
        ])
    .controller(
        "BristlebirdAboutController",
        [
            "$scope",
            "$location",
            BristlebirdAboutController
        ]);
