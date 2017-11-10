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
                CitizenScienceCommon,
                CsApi,
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
         *      },{
         *          "annotationId": 124727
         *      },{
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

        $scope.numSamplesViewed = SampleLabels.getNumSamplesViewed();

        CsApi.getLabels($scope.csProject).then(function (labels) {
            $scope.labels = labels;
        });


        SampleLabels.init($scope.csProject, $scope.samples, $scope.labels);

        $scope.$on("label-toggle", function (e, labelNumber, value) {
            self.toggleLabel(labelNumber, value);
        });

        /**
         * applies or removes the tag-sets of the given label number
         * to the current sample
         * @param labelNumber
         * @param value boolean if omitted will flip the current value
         */
        self.toggleLabel = function (labelId, value) {
            console.log("toggling label ", labelId, value);
            if (typeof value !== "boolean") {
                value = !SampleLabels.getValue($scope.currentSample.id, labelId);
            }
            SampleLabels.setValue($scope.currentSample.id, labelId, value);
        };


        /**
         * Retrieve settings about this citizen science project
         */
        CsApi.getSettings($scope.csProject).then(
            function (settings) {
                $scope.settings = settings;
                if ($scope.settings.hasOwnProperty("sampleDuration")) {
                    self.sampleDuration = $scope.settings.sampleDuration;
                }
            }
        );


        /**
         * When the currentSampleNum changes, change the current audio file / spectrogram to match it
         */
        $scope.$watch("currentSample", function () {
            if ($scope.currentSample.id !== undefined) {
                console.log("load audio for sample " + $scope.currentSample);
                self.showAudio($scope.currentSample.recordingId, $scope.currentSample.startOffset, self.sampleDuration);
                var backgroundPath = self.backgroundPaths[parseInt($scope.currentSample.id) % (self.backgroundPaths.length - 1)];
                backgroundImage.currentBackground = backgroundPath;
                $scope.$broadcast("update-selected-labels", SampleLabels.getLabelsForSample($scope.currentSample.id));
                // record that this sample has been viewed
                SampleLabels.setValue($scope.currentSample.id);
                $scope.numSamplesViewed = SampleLabels.getNumSamplesViewed();
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
        // $scope.$on(ngAudioEvents.ended, function navigate(event, model) {
        //     if (model === $scope.audioElementModel) {
        //         $scope.$safeApply($scope, function () {
        //             $scope.goToSample();
        //         });
        //     }
        // });

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
        "bawApp.citizenScience.csApiMock"
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
            "CsApi",
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
