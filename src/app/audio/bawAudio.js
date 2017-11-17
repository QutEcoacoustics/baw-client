
angular.module("bawApp.audio.bawAudio", [])
    .component("bawAudio", {
        templateUrl: "audio/bawAudio.tpl.html",
        controller: [
            "$scope",
            "$route",
            function ($scope, $route) {

                var self = this;

                $scope.audioElementModel = self.audioElementModel;

                /**
                 * Reload audio when the source changes. Without this it won't change the audio
                 * even though the src attribute changes
                 */
                $scope.$watch("media", function () {
                    console.log("new media loaded");
                    document.querySelector("audio").load();
                    //$route.reload();
                });



            }],
        bindings: {
            audioElementModel: "=",
            media: "="
        }
    });
