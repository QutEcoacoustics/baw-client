var audioButtons = audioButtons || angular.module("bawApp.components.audioButtons", []);


audioButtons.component("playButton", {
        templateUrl: "components/directives/audioButtons/playButton.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                var self = this;

                $scope.audioElementModel = self.audioElementModel;

                /**
                 * Toggles play/pause state when play/pause button is pressed
                 */
                $scope.togglePlayState = function togglePlay() {
                    if ($scope.audioElementModel.isPlaying) {
                        $scope.audioElementModel.pause();
                    }
                    else {
                        $scope.audioElementModel.play();
                    }
                };


            }],
        bindings: {
            audioElementModel: "="
        }
    });
