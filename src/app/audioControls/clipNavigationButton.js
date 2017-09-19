
angular.module("bawApp.audioControls.clipNavigationButton", [])
    .component("clipNavigationButton", {
        templateUrl: "audioControls/clipNavigationButton.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                var self = this;



                /**
                 * Returns whether the next button is disabled based on whether
                 * the bound link is a string of length at least 1
                 * @returns {boolean}
                 */
                $scope.disabled = function () {
                    var anchorLinkValue = self.anchorLink();
                    return !(angular.isString(anchorLinkValue) && anchorLinkValue.length > 0);
                };

            }],
        bindings: {
            anchorLink: "=",
            direction: "="
        }
    });
