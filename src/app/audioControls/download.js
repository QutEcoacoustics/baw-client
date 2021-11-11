angular.module("bawApp.audioControls.download", [])
    .component("download", {
        templateUrl: "audioControls/download.tpl.html",
        controller: [
            "$scope",
            "$routeParams",
            "conf.paths",
            function ($scope, $routeParams, paths) {
                $scope.originalAudioUrl = paths.api.routes.audioRecording.originalAbsolute.format({
                    "recordingId": $routeParams.recordingId
                });
            }
        ],
        transclude: true,
        bindings: {
            media: "=",
            otherLinks: "="
        }
    });

