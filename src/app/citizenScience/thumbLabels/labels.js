angular.module("bawApp.components.citizenScienceThumbLabels",
    [
        "bawApp.components.citizenScienceThumbLabels.label"
    ])
    .component("citizenScienceLabels", {
        templateUrl: "citizenScience/thumbLabels/labels.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            "annotationLibraryCommon",
            "AudioEvent",
            "baw.models.AudioEvent",
            "$q",
            function ($scope,
                      $http,
                      CitizenScienceCommon,
                      libraryCommon,
                      AudioEventService) {

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

                $scope.$watch(function () {
                    return self.questionData;
                }, function (newVal, oldVal) {
                    if (newVal !== null && typeof newVal === "object") {
                        if (newVal.hasOwnProperty("labels")) {
                            self.fetchAnnotationData();
                        }
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
                    var labels = self.questionData.labels;
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
                            console.log("get audio events by ids failed", error);
                        })
                        .then(function (response) {

                            // add annotations back into labels object
                            response.annotations.forEach(function (annotation) {
                               self.questionData.labels.forEach(function (l) {
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
            }],
        bindings: {
            questionData: "=",
        }
    });