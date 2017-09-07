
angular.module("bawApp.audioControls.playButton", [])
    .component("playButton", {
        templateUrl: "audioControls/playButton.tpl.html",
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
