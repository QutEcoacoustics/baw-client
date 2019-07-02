angular.module("bawApp.components.citizenScienceThumbLabels",
    [
        "bawApp.components.citizenScienceThumbLabels.label",
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceThumbLabels", {
        templateUrl: "citizenScience/labels/thumbLabels/labels.tpl.html",
        controller: [
            "$scope",
            "$http",
            "annotationLibraryCommon",
            "AudioEvent",
            "SampleLabels",
            "onboardingService",
            function ($scope,
                      $http,
                      libraryCommon,
                      AudioEventService,
                      SampleLabels,
                      onboardingService) {

                var self = this;

                $scope.currentDetailsLabelId = {value: -1};

                $scope.$on("show-label-details", () =>  {
                    if ($scope.currentDetailsLabelId.value < 0) {
                        $scope.currentDetailsLabelId.value = self.labels[0].id;
                        $scope.$apply();
                    }
                });

                $scope.$on("hide-label-details", () =>  {
                    $scope.currentDetailsLabelId.value = -1;
                    $scope.$apply();
                });

                $scope.examplesPosition = "0px";

                /**
                 * Watch for labels to be updated so that the examples etc can be loaded
                 */
                $scope.$watch(function () {
                    return self.labels;
                }, function (newVal, oldVal) {
                    if (Array.isArray(newVal)) {
                        self.fetchAnnotationData();
                    }
                });

                /**
                 * fetches site/project/media data for all label examples
                 * updates the labels' examples array, replacing each annotationId with a
                 * full "anotation" object that contains the AudioEvent model as well Media model
                 * @param labels Object
                 */
                self.fetchAnnotationData = function () {

                    // transform labels structure into a single array of annotationsIds
                    var labels = self.labels;
                    var annotationIds = [].concat.apply([], labels.map(l => l.examples)).map(e => e.annotationId);

                    if (annotationIds.length === 0) {
                        return;
                    }

                    var annotations = [];

                    AudioEventService
                        .getAudioEventsByIds(annotationIds)
                        .then(function (response) {

                            annotations = response.data.data || [];

                            var annotationIds = new Set(),
                                recordingIds = new Set();

                            annotations.forEach(function (resource, index) {

                                annotationIds.add(resource.id);
                                recordingIds.add(resource.audioRecordingId);
                                libraryCommon.addCalculatedProperties(resource);

                            });

                            var data = {
                                annotations,
                                annotationIds,
                                recordingIds
                            };

                            var x = libraryCommon.getSiteMediaAndProject(data);
                            return x;

                        }, function (error) {
                            console.warn("get audio events by ids failed", error);
                        })
                        .then(function (response) {

                            // add annotations back into labels object
                            response.annotations.forEach(function (annotation) {
                               self.labels.forEach(function (l) {
                                   l.examples.forEach(function (e) {
                                       if (e.annotationId === annotation.id) {
                                           e.annotation = annotation;
                                       }
                                   });
                               });
                            });


                        }, function (httpResponse) {
                                console.error("Failed to load citizen science example item response.", httpResponse);
                        });
                };


                onboardingService.addSteps([
                    {
                        element: ".citizen-science-thumb",
                        intro: "See if you can identify the events that are in these small spectrogram thumbnails in the audio clip above. " +
                        "Tap the thumbnail for a closer look and to listen to the audio.",
                        order: 5
                    },
                    {
                        element: ".label-check a",
                        intro: "Use the checkbox to indicate if the this kind of event occurs in the audio clip above",
                        order: 5

                    },
                    {
                        element: ".label-examples-annotations .label-check a",
                        intro: "You can also use this checkbox to select the call",
                        order: 5

                    }

                ]);

                onboardingService.addCallbacks({
                    onBeforeStart: function () {
                        $scope.$broadcast("show-label-details");
                    },
                    onExit: function () {
                        $scope.$broadcast("hide-label-details");
                    }
                });


            }],
        bindings: {
            labels: "=",
        }
    });