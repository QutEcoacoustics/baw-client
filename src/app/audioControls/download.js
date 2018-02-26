angular.module("bawApp.audioControls.download", [])
    .component("download", {
        templateUrl: "audioControls/download.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                $scope.downloadLinksShowing = false;

                $scope.toggleShowDownloadLinks = function () {
                    $scope.downloadLinksShowing = !$scope.downloadLinksShowing;
                };

                $scope.hideDownloadLinks = function () {
                    $scope.downloadLinksShowing = false;
                };

        }],
        bindings: {
            media: "=",
            otherLinks: "="
        }
    });

