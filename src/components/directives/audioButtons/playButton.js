var audioButtons = audioButtons || angular.module("bawApp.components.audioButtons", []);


audioButtons.component("playButton", {
        templateUrl: "components/directives/audioButtons/playButton.tpl.html",
        controller: [
            "$scope",
            "AudioEvent",
            "baw.models.AudioEvent",
            function ($scope, AudioEventService, AudioEvent) {

                var self = this;

                $scope.audioElement = self.audioElement;

                /**
                 * Toggles play/pause state when play/pause button is pressed
                 */
                $scope.togglePlayState = function togglePlay() {
                    if ($scope.audioElement.isPlaying) {
                        $scope.audioElement.pause();
                    }
                    else {
                        $scope.audioElement.play();
                    }
                };


            }],
        bindings: {
            audioElement: "="
        }
    });
