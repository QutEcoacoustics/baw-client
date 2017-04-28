angular.module("bawApp.components.citizenScienceThumbLabels.examples",
    [
        "bawApp.citizenScience.common"
    ])
    .component("citizenScienceLabelExamples", {
        templateUrl: "citizenScience/thumbLabels/examples.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            "annotationLibraryCommon",
            "AudioEvent",
            "baw.models.AudioEvent",
            function ($scope, $http, CitizenScienceCommon, libraryCommon, AudioEventService, AudioEvent) {

                var self = this;

                $scope.changeCurExample = function (labelNum, changeBy) {
                    var l = self.examples.length;
                    // add changeBy and wrap if the result is larger than length
                    self.curExample = ((self.curExample + changeBy % l) + l) % l;
                    console.log("changed cur example for label " + self.label + " to " + self.curExample);
                };


                /**
                 * initialises curExample after examples have been loaded (they are loaded async)
                 */
                $scope.$watch(function () {
                    return self.examples;
                }, function (newValue, oldValue) {

                    if (Array.isArray(newValue)) {
                        if (newValue.length) {
                            self.curExample = 0;
                        } else {
                            self.curExample = -1;
                        }
                    }

                });

                $scope.annotations = [];

                self.examples.forEach(function (example, index) {

                    // based on stuff in library item. may be able to make this more DRY
                    AudioEventService
                        .getAudioEventsByIds([example.annotationId])
                        .then(function annotationShowSuccess(response, responseHeaders) {
                                var audioEvents = response.data.data;

                                var annotation = new AudioEvent(audioEvents[0]);

                                var commonData = {
                                    annotations: [annotation],
                                    annotationIds: new Set([annotation.id]),
                                    recordingIds: new Set([annotation.audioRecordingId])
                                };

                                // do we need this stuff? if so, need more dependencies
                                libraryCommon.addCalculatedProperties(annotation);
                                libraryCommon.getSiteMediaAndProject(commonData);
                                libraryCommon.getUsers(commonData);

                                $scope.annotations[index] = annotation;

                                //todo load these from user preferences
                                $scope.annotations[index].audioElement = {
                                    volume: 1,
                                    muted: false,
                                    autoPlay: false,
                                    position: 0
                                };


                            },
                            function annotationShowError(httpResponse) {
                                console.error("Failed to load citizen science example item response.", httpResponse);
                            });

                });


            }],
        bindings: {
            examples: "=examples",
            label: "=label"
        }
    });