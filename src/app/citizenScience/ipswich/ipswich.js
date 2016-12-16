class IpswichAboutController {
    constructor($scope,
                $location) {

        $scope.citizenScientistName = "";

        $scope.getStarted = function () {
            localStorage.setItem("citizenScientistName", $scope.citizenScientistName);
            $location.path("/citsci/ipswich/listen");
        };
    }
}


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

        $scope.csProject = "ipswich";

        // currently all samples will be the same duration (not set per sample in the dataset)
        self.sampleDuration = 20;

        /**
         *
         *  samples is retrieved from the google sheet via the api
         *  and will come back in the following format:
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
        $scope.samples = [];
        $scope.currentSampleNum = -1;

        // to be populated after getting samples from dataset
        $scope.media = null;


        // list of possible labels to be retrieved from the dataset sheet
        $scope.labels = {};

        /**
         * retrieves the list of allowed labels from the dataset
         * @TODO: update this to conform to the new format (multiple tags per label, examples)
         * currently broken
         */
        $http.get(CitizenScienceCommon.apiUrl(
            "labels",
            $scope.csProject
        )).then(function (response) {
            console.log(response.data);
            if (Array.isArray(response.data)) {
                $scope.labels = CitizenScienceCommon.labelArrayToObject(response.data);
            } else {
                $scope.labels = {};
            }

        });

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
                console.log("load audio for sample " + $scope.currentSampleNum);
                var currentSample = $scope.samples[$scope.currentSampleNum];
                self.showAudio(currentSample.recordingId, currentSample.startOffset, self.sampleDuration);
                //self.changeBackground();
            }
        });

        // reload audio when the source changes. Without this it won't change the audio
        // even though the src attribute changes
        $scope.$watch("media", function () {
            document.querySelector("audio").load();
        });

        $scope.$watch("model", function (oldval, newval) {
            console.log("model changed", oldval, newval);
        }, true);

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

        /**
         * backgrounds
         */
        // self.backgrounds = ["1.jpg","2.jpg","3.jpg","4.jpg"];
        // self.currentBackgroundNum = 0;
        // $scope.currentBackground = null;
        // self.changeBackground = function () {
        //     self.currentBackgroundNum = (self.currentBackgroundNum+1) % self.backgrounds.length;
        //     $scope.currentBackground = "/build/assets/img/citizen-science/backgrounds/" + self.backgrounds[self.currentBackgroundNum];
        // };
        // self.changeBackground();
        //

    }

}


angular
    .module("bawApp.citizenScience.ipswich", [
        "bawApp.components.progress",
        "bawApp.components.background",
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
        ])
    .controller(
        "IpswichAboutController",
        [
            "$scope",
            "$location",
            IpswichAboutController
        ]);
