angular.module("bawApp.components.citizenScienceExample", ["bawApp.citizenScience.common"])
    .component("citizenScienceExample", {
        templateUrl: "citizenScience/examples/citizenScienceExample.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            "annotationLibraryCommon",
            "AudioEvent",
            "baw.models.AudioEvent",
            function ($scope, $http, CitizenScienceCommon, libraryCommon, AudioEventService, AudioEvent) {

                console.log("hello example");

                $scope.myName = "example";

                var self = this;

                // based on stuff in library item. may be able to make this more DRY
                AudioEventService
                    .getAudioEventsByIds([self.example.annotationId])
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
                            libraryCommon.getTags(commonData);
                            libraryCommon.getSiteMediaAndProject(commonData);
                            libraryCommon.getUsers(commonData);

                            $scope.annotation = annotation;

                            //todo load these from user preferences
                            $scope.annotation.audioElement = {
                                volume: 1,
                                muted: false,
                                autoPlay: true,
                                position: 0
                            };


                        },
                        function annotationShowError(httpResponse) {
                            console.error("Failed to load citizen science example item response.", httpResponse);
                        });


            }],
        bindings: {
            example: "=example",
            selected: "=selected"
        }
    });