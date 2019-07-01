class CitizenScienceListenController {
    constructor($scope,
                ngAudioEvents,
                $location,
                CitizenScienceCommon,
                CsSamples,
                SampleLabels,
                backgroundImage,
                paths,
                Question,
                $routeParams,
                StudyService,
                onboardingService
    ) {

        var self = this;

        /**
         * The name of the css project as it appears in the dataset definition
         * @type {string}
         */
        $scope.csProject = $routeParams.studyName;

        /**
         * The current sample object, including sample id
         * @type {number}
         */
        $scope.currentItem = CsSamples.currentItem;

        $scope.onPlayed = CsSamples.onPlayed;

        // to be populated after getting samples from dataset
        $scope.media = null;

        onboardingService.addSteps([
            {
                element: ".citizen-science .spectrogram-wrapper",
                intro: "This shows a picture of the audio as a spectrogram.",
                order: 0
            },
            {
                element: "previous-play-next",
                intro: "Start or stop the audio here.",
                order: 0
            },

            {
                element: "dataset-progress button",
                intro: "When you have finished applying labels, use this button to go to the next clip",
                order: 10

            },
            {
                element: ".autoplay",
                intro: "Switch this on to automatically progress to the next clip when you reach the end of the current one.",
                order: 11
            }

        ]);

        $scope.questionData = {};

        // the model passed to ngAudio
        $scope.audioElementModel = CitizenScienceCommon.getAudioModel();

        this.showAudio = CitizenScienceCommon.bindShowAudio($scope);


        // get the study information by name, then load the appropriate question data
        StudyService.studyByName($routeParams.studyName).then(x => {
            var studies = x.data.data;
            if (studies.length === 0) {
                console.warn("No study " + $routeParams.studyName + " exists");
                return;
            } else if (studies.length > 1) {
                console.warn("More than one study found. Using the first one");
            }

            $scope.study = studies[0];

            Question.questions($scope.study.id).then(x => {
                console.log("questions loaded", x);
                //TODO: update to allow multiple questions
                $scope.questionData = x.data.data[0].questionData;

                SampleLabels.init(x.data.data[0], $scope.study.id);
            });
        });


        $scope.studyTitle = {"bristlebird": "Eastern Bristlebird Search", "koala-verification": "Koala Verification"}[$scope.csProject];



        //SampleLabels.init($scope.csProject, $scope.samples, $scope.labels);

        /**
         * When the currentItem changes, change the current audio file / spectrogram to match it
         */
        $scope.$watch(function () {
            return CsSamples.currentItem();
            },
            function (item, oldVal) {
                if (item) {

                    if (item.id !== oldVal.id) {
                        self.showAudio(item.audioRecordingId, item.startTimeSeconds, item.endTimeSeconds);
                        $scope.$broadcast("update-selected-labels", SampleLabels.getLabelsForSample(item.id));
                    }

                    if (item.hasOwnProperty("audioRecording")) {
                        backgroundImage.setBackgroundImageForItem(item.audioRecording, item.startTimeSeconds);
                    }

                }
            }, true);

        /**
         * auto play feature
         * when the playback arrives at the end of the audio, it will proceed to the next segment.
         * The url for the next segment will be returned from the nextLink function, which
         * is initialised to null, then reverse bound bound from the data progress component

         *TODO: make this work with non-url progress
         */
        //$scope.nextLink = null;
        $scope.$on(ngAudioEvents.ended, function navigate(event) {

            if (event.targetScope.audioElementModel === $scope.audioElementModel && $scope.audioElementModel.autoPlay) {
                $scope.$broadcast("autoNextTrigger");
            }
        });

    }

}

angular
    .module("bawApp.citizenScience.listen", [
        "bawApp.components.progress",
        "bawApp.citizenScience.common",
        "bawApp.citizenScience.sampleLabels",
        "bawApp.citizenScience.csLabels",
        "bawApp.components.onboarding",
        "bawApp.components.background"
    ])
    .controller(
        "CitizenScienceListenController",
        [
            "$scope",
            "ngAudioEvents",
            "$location",
            "CitizenScienceCommon",
            "CsSamples",
            "SampleLabels",
            "backgroundImage",
            "conf.paths",
            "Question",
            "$routeParams",
            "Study",
            "onboardingService",
            CitizenScienceListenController
        ]);

