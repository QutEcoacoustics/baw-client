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

        /**
         * The name of the css project as it appears in the dataset definition
         * @type {string}
         */
        $scope.csProject = "ebb";

        /**
         * The duration of each audio sample
         * currently all samples will be the same duration (not set per sample in the dataset)
         * @type {number}
         */
        self.sampleDuration = 10;

        /**
         * list of the samples, to be retrieved from the dataset
         * @type {Array}
         */
        $scope.samples = [];

        /**
         * Inddex in the samples array of the current sample
         * @type {number}
         */
        $scope.currentSampleNum = -1;

        // to be populated after getting samples from dataset
        $scope.media = null;

        /**
         * Labels that the user can select.
         * applies one or more tags which are not shown to the user
         */
        $scope.labels = [{
            "tags":["ebb","type1"],
            "label": "I found an Eastern Bristlebirdy",
            "example":{
                "annotationId":12121
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

        /**
         * When the currentSampleNum changes, change the current audio file / spectrogram to match it
         */
        $scope.$watch("currentSampleNum", function () {
            if ($scope.currentSampleNum > -1) {
                console.log("load audio for sample "+ $scope.currentSampleNum);
                var currentSample = $scope.samples[$scope.currentSampleNum];
                self.showAudio(currentSample.recordingId, currentSample.startOffset, self.sampleDuration);
            }
        });

        /**
         * Reload audio when the source changes. Without this it won't change the audio
         * even though the src attribute changes
         */
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
        "bawApp.components.citizenScienceLabels",
        "bawApp.components.citizenScienceExamples"
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
