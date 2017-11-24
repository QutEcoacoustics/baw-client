
angular.module("bawApp.audioControls.previousPlayNext", [])
    .component("previousPlayNext", {
        templateUrl: "audioControls/previousPlayNext.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                var self = this;

                $scope.audioElementModel = self.audioElementModel;

                /**
                 * Toggles play/pause state when play/pause button is pressed
                 */
                $scope.togglePlayState = function togglePlay() {
                    console.log("togglePlayState", $scope.audioElementModel);
                    if ($scope.audioElementModel.isPlaying) {
                        $scope.audioElementModel.pause();
                    }
                    else {
                        $scope.audioElementModel.play();
                    }
                };

                /**
                 * Returns whether the next/previous button is disabled based on whether
                 * the bound link is a string of length at least 1
                 * @returns {boolean}
                 */
                $scope.nextDisabled = function () {
                    return self.linkDisabled(self.nextLink);

                };
                $scope.previousDisabled = function () {
                    return self.linkDisabled(self.previousLink);
                };

                self.linkDisabled = function (linkFunction) {
                    var linkValue = linkFunction();
                    return !(angular.isString(linkValue) && linkValue.length > 0);
                };


                /**
                 * If the bound functions previousLink and/or NextLink are functions
                 * show the relevent link element
                 * @type {boolean}
                 */
                $scope.showPrevious = typeof self.previousLink === "function";
                $scope.showNext = typeof self.nextLink === "function";

            }],
        bindings: {
            audioElementModel: "=",
            previousLink: "=",
            nextLink: "="
        }
    });
