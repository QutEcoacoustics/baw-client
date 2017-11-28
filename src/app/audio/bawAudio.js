
angular.module("bawApp.audio.bawAudio", [])
    .component("bawAudio", {
        templateUrl: "audio/bawAudio.tpl.html",
        controller: [
            "$scope",
            "$route",
            "$timeout",
            function ($scope, $route, $timeout) {

            }],
        bindings: {
            audioElementModel: "=",
            media: "=",
            updateScope: "="
        }
    });
