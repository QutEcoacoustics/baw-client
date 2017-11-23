
angular.module("bawApp.audio.bawAudio", [])
    .component("bawAudio", {
        templateUrl: "audio/bawAudio.tpl.html",
        controller: [
            "$scope",
            "$route",
            "$timeout",
            function ($scope, $route, $timeout) {

                var self = this;

                $scope.audioElementModel = self.audioElementModel;

            }],
        bindings: {
            audioElementModel: "=",
            media: "="
        }
    });
