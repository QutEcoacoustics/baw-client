angular.module("bawApp.audioControls.download", [])
    .component("download", {
        templateUrl: "audioControls/download.tpl.html",
        controller: [
            "$scope",
            function ($scope) {
        }],
        transclude: true,
        bindings: {
            media: "=",
            otherLinks: "="
        }
    });

