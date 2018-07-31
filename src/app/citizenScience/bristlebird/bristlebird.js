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
                ngAudioEvents,
                $location,
                CitizenScienceCommon,
                CsSamples,
                SampleLabels,
                backgroundImage,
                paths) {

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
        self.sampleDuration = 25;


        /**
         * The current sample object, including sample id
         * @type {number}
         */
        self.currentSample = {};

        // to be populated after getting samples from dataset
        $scope.media = null;

        $scope.onboardingSteps = [
            {
                element: document.querySelector(".citizen-science .spectrogram-wrapper"),
                intro: "This shows a picture of the audio as a spectrogram."
            },
            {
                element: document.querySelector("dataset-progress"),
                intro: "This shows how many clips you have listened do, and lets you navigate between clips"
            },
            {
                element: document.querySelector(".autoplay"),
                intro: "Switch this on to automatically progress to the next clip and play it."
            }
        ];

        /**
         * Labels that the user can select.
         * applies one or more tags which are not shown to the user.
         * example response from server
         *   [{
         *      "tags": ["ebb", "type1"],
         *      "name": "Eastern Bristlebird",
         *      "examples": [{
         *          "annotationId": 124730
         *      }, {
         *          "annotationId": 124727
         *      }, {
         *           "annotationId": 98378
         *       }]
         *   },
         *   {
         *       "tags": ["ground_parrot", "type1"],
         *       "name": "Ground Parrot",
         *       "examples": [{
         *           "annotationId": 124622
         *       }]
         *   },
         *   {
         *       "tags": ["quoll", "type1"],
         *       "label": "Spotted Quoll",
         *       "examples": []
         *   }];
         */

        $scope.labels = [];

        $scope.currentSample = {};

        // the model passed to ngAudio
        $scope.audioElementModel = CitizenScienceCommon.getAudioModel();

        this.showAudio = CitizenScienceCommon.bindShowAudio($scope);

        CsSamples.getLabels($scope.csProject).then(function (labels) {
            $scope.labels = labels;
        });

        SampleLabels.init($scope.csProject, $scope.samples, $scope.labels);

        /**
         * Retrieve settings about this citizen science project
         */
        CsSamples.getSettings($scope.csProject).then(
            function (settings) {
                $scope.settings = settings;
                if ($scope.settings.hasOwnProperty("sampleDuration")) {
                    self.sampleDuration = $scope.settings.sampleDuration;
                }
            }
        );

        /**
         * When the currentSample changes, change the current audio file / spectrogram to match it
         */
        $scope.$watch("currentSample", function () {
            if ($scope.currentSample.id !== undefined) {
                self.showAudio($scope.currentSample.audioRecordingId, $scope.currentSample.startTimeSeconds, $scope.currentSample.endTimeSeconds);
                // for now, we cycle through backgrounds arbitrarily, based on the id of the sample number
                // todo: store background images as part of the dataset or cs project
                var backgroundPath = self.backgroundPaths[parseInt($scope.currentSample.id) % (self.backgroundPaths.length - 1)];
                backgroundImage.currentBackground = backgroundPath;
                $scope.$broadcast("update-selected-labels", SampleLabels.getLabelsForSample($scope.currentSample.id));
                // record that this sample has been viewed
                SampleLabels.setValue($scope.currentSample.id);
                $scope.numSamplesViewed = SampleLabels.getNumSamplesViewed();
            }
        });

        /**
         * auto play feature
         * when the playback arrives at the end of the audio, it will proceed to the next segment.
         * The url for the next segment will be returned from the nextLink function, which
         * is initialised to null, then reverse bound bound from the data progress component
         */
        $scope.nextLink = null;
        $scope.$on(ngAudioEvents.ended, function navigate(event) {
            var uriNext = $scope.nextLink();
            if (uriNext && $scope.audioElementModel.autoPlay) {
                console.info("Changing page to next sample...");
                $scope.$apply(function () {
                    $location.url(uriNext);
                });
            }
        });

        self.backgroundPaths = ["1.jpg", "2.jpg", "3.jpg", "4.jpg"].map(fn => paths.site.assets.backgrounds.citizenScience + fn);

    }

}

angular
    .module("bawApp.citizenScience.bristlebird", [
        "bawApp.components.progress",
        "bawApp.citizenScience.common",
        "bawApp.citizenScience.sampleLabels",
        "bawApp.components.citizenScienceThumbLabels",
        "bawApp.components.onboarding",
        "bawApp.components.background",
        "bawApp.citizenScience.csSamples"
    ])
    .controller(
        "BristlebirdController",
        [
            "$scope",
            "ngAudioEvents",
            "$location",
            "CitizenScienceCommon",
            "CsSamples",
            "SampleLabels",
            "backgroundImage",
            "conf.paths",
            BristlebirdController
        ])
    .controller(
        "BristlebirdAboutController",
        [
            "$scope",
            "$location",
            BristlebirdAboutController
        ]);
