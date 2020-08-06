class CitizenScienceListenController {
    constructor($scope,
                ngAudioEvents,
                CitizenScienceCommon,
                CsSamples,
                SampleLabels,
                backgroundImage,
                Question,
                $routeParams,
                StudyService,
                onboardingService,
                UserProfile,
                $rootScope
    ) {

        /**
         * The name of the css project as it appears in the dataset definition
         * @type {string}
         */
        $scope.csProject = $routeParams.studyName;

        CitizenScienceCommon.studyData.studyName = $scope.csProject;

        UserProfile.get.then(() => {
            if (!UserProfile.profile.id) {
                $rootScope.$broadcast("event:auth-loginRequired");
            }
        });

        /**
         * The current sample object, including sample id
         * @type {number}
         */
        $scope.currentItem = CsSamples.currentItem;

        $scope.onPlayed = CsSamples.onPlayed;

        // to be populated after getting samples from dataset
        $scope.media = null;

        onboardingService.init();

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
                element: "dataset-progress .btn",
                intro: "When you have finished applying labels, use this button to go to the next clip",
                order: 10
            },
            {
                element: ".autoplay",
                intro: "Switch this on to automatically progress to the next clip when you reach the end of the current one.",
                order: 11
            }

        ], "spectrogram");

        $scope.$on("spectrogram-loaded", function (scope) {
            onboardingService.ready("spectrogram");
        });

        $scope.questionData = {};

        // the model passed to ngAudio
        $scope.audioElementModel = CitizenScienceCommon.getAudioModel();
        $scope.sample = {
            item: null
        };

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
            CitizenScienceCommon.studyData.study = $scope.study;
            Question.questions($scope.study.id).then(x => {
                console.log("questions loaded", x);

                // // TEMP FOR TESTING lots of labels
                // var temp = x.data.data[0].questionData;
                // temp.labels = temp.labels.concat(temp.labels).concat(temp.labels).concat(temp.labels).map((x,i) => {
                //     x.id = i+1;
                //     return x;
                // });;
                //
                // x.data.data[0].questionData = temp;

                onboardingService.ready("questions");

                //TODO: update to allow multiple questions
                $scope.questionData = x.data.data[0].questionData;

                SampleLabels.init(x.data.data[0], $scope.study.id);
            });
        });

        var titleMap = {"bristlebird": "Eastern Bristlebird Search", "koala-verification": "Koala Verification"};
        if (titleMap.hasOwnProperty($scope.csProject)) {
            $scope.studyTitle = titleMap[$scope.csProject];
        } else {
            // replace hyphen with space and capitalize words
            $scope.studyTitle = $scope.csProject.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        }

        var studySettingsPresets = {
            "default": {
                showSite: false,
                showDateTime: false,
                showProgress: false,
            },
            "verification": {
                showSite: true,
                showDateTime: true,
                showProgress: true
            }
        };

        // find the first settings preset that has the key in the study name
        // (i.e. use the verification settings if the word 'verification' appears in the study name)
        var settingsKey;
        if (studySettingsPresets.hasOwnProperty($scope.csProject)) {
            settingsKey = $scope.csProject;
        } else {
            settingsKey = Object.keys(studySettingsPresets).find(key => {
                return $scope.csProject.includes(key);
            });
            settingsKey = settingsKey ? settingsKey : "default";
        }

        $scope.settings = studySettingsPresets[settingsKey];

        /**
         * When the currentItem changes, change the current audio file / spectrogram to match it
         */
        $scope.$watch(function () {

                // returns the current item if the media is loaded, otherwise returns false.
                var currentItem = CsSamples.currentItem();
                // 'start' is the last thing to be attached to the datasetItems
                if (currentItem && currentItem.hasOwnProperty("start")) {
                    return currentItem;
                }

                return false;
            },
            function (item, oldVal) {
                if (item) {
                    $scope.media = item.media;
                    if (item.hasOwnProperty("audioRecording")) {
                        backgroundImage.setBackgroundImageForItem(item.audioRecording, item.startTimeSeconds);
                    }

                    $scope.sample.item = item;

                }
            });

        /**
         * auto play feature
         * when the playback arrives at the end of the audio, it will proceed to the next segment.
         */
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
        "bawApp.components.progressIndicator",
        "bawApp.citizenScience.common",
        "bawApp.citizenScience.sampleLabels",
        "bawApp.citizenScience.csLabels",
        "bawApp.components.onboarding",
        "bawApp.components.background",
        "bawApp.citizenScience.itemInfo",
        "bawApp.spectrogram"
    ])
    .controller(
        "CitizenScienceListenController",
        [
            "$scope",
            "ngAudioEvents",
            "CitizenScienceCommon",
            "CsSamples",
            "SampleLabels",
            "backgroundImage",
            "Question",
            "$routeParams",
            "Study",
            "onboardingService",
            "UserProfile",
            "$rootScope",
            CitizenScienceListenController
        ]);

