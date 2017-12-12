angular.module("bawApp.audioControls.volumeSlider", [])
    .component("volumeSlider", {
        templateUrl: "audioControls/volumeSlider.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                var self = this;

                /**
                 * toggles the value for muted on the audio model
                 */
                $scope.toggleMute = function () {
                    self.audioElementModel.muted = !self.audioElementModel.muted;
                };

        }],
        bindings: {
            audioElementModel: "="
        }
    });

