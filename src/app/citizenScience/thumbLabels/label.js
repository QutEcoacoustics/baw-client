angular.module("bawApp.components.citizenScienceThumbLabels.label",
    [
        "bawApp.components.citizenScienceThumbLabels.examples"
    ])
    .component("citizenScienceLabel", {
        templateUrl: "citizenScience/thumbLabels/label.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            "annotationLibraryCommon",
            "AudioEvent",
            "baw.models.AudioEvent",
            function ($scope, $http, CitizenScienceCommon, libraryCommon, AudioEventService, AudioEvent) {

                var self = this;

                $scope.thumbSrc = "";



                self.getThumbSrc = function () {

                    if (self.examples.length < 1) {
                        console.error("no examples for label thumbnail", self.tags, self.label);
                        return;
                    }

                    var firstExample = self.examples[0];

                    AudioEventService
                        .getAudioEventsByIds([firstExample.annotationId])
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
                                libraryCommon.getSiteMediaAndProject(commonData).then(function (result) {

                                    $scope.thumbSrc = annotation.media.available.image.png.url;
                                    console.log("got the annotation", annotation);

                                });
                                libraryCommon.getUsers(commonData);


                            },
                            function annotationShowError(httpResponse) {
                                console.error("Failed to load citizen science example item response.", httpResponse);
                            });

                };


                self.getThumbSrc();



            }],
        bindings: {

            // example annotations of this event-type
            // in the form [{annotationId:123},{annotationId:456}, ... ]
            examples: "=examples",

            // tags that this event type are associated with
            tags: "=tags",

            // the label for this thumb
            label: "=label",

            // whether this thumb is currently selected
            selected: "=selected"
        }
    });