
angular.module("bawApp.audioControls.autoplayButton", [])
    .component("autoplayButton", {
        templateUrl: "audioControls/autoplayButton.tpl.html",
        controller: [
            "$scope",
            "UserProfile",
            function ($scope, UserProfile) {

                var self = this;

                /**
                 * Watch for changes to the autoPlay property in the audioElementModel
                 * and then emit the event so that the listener is triggered and the new value
                 * is saved to the server.
                 */
                $scope.$watch(function () {
                    return self.audioElementModel.autoPlay;
                }, function (newValue, oldValue) {
                    if (UserProfile.profile && (UserProfile.profile.preferences.autoPlay !== newValue)) {
                        $scope.$emit("autoPlay", newValue);
                    }
                });

            }],
        bindings: {
            audioElementModel: "="
        }
    });
