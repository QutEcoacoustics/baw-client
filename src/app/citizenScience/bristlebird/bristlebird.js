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
        $scope.currentSample = -1;

        // to be populated after getting samples from dataset
        $scope.media = null;

        // list of labels that can be applied to samples
        $scope.labels = [];

        $scope.labels = {"ebb":"I found an Eastern Bristlebird"};

        self.profileLoaded = function (event, UserProfile) {
            self.getSamples(UserProfile);
        };

        $scope.$on(UserProfileEvents.loaded, self.profileLoaded);
        if (UserProfile.profile && UserProfile.profile.preferences) {
            self.profileLoaded(null, UserProfile);
        }

        self.getSamples = function (UserProfile) {
            if ($scope.samples.length === 0) {
                var url = CitizenScienceCommon.apiUrl(
                    "userSamples",
                    $scope.csProject,
                    UserProfile.profile.userName);
                //TODO: error handling
                $http.get(url).then(function (response) {
                    //console.log(response.data);
                    var samples = response.data;
                    $scope.samples = samples;
                    $scope.goToSample(0);
                });
            }
        };

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
                console.log("load audio for sample "+ $scope.currentSample);
                var currentSample = $scope.samples[$scope.currentSample];
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
         * when the playback arrives at the end of the audio, it will assume
         * that no bristlebirds have been found and proceed to the next segment.
         */
        $scope.$on(ngAudioEvents.ended, function navigate(event) {
                console.info("Changing page to next segment...");
                self.done(false);
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
        ]);
