angular.module("bawApp.spectrogram", [])
    .directive("spectrogram", ["$rootScope", function ($rootScope) {
        return {
            restrict: "A",
            link: function ($scope, element, attributes) {

                element[0].addEventListener("load", event => {
                    $rootScope.$broadcast("spectrogram-loaded", $scope);
                });

                element[0].addEventListener("error", event => {
                    console.log("spectrogram could not be loaded");
                });

            }
        };
    }]);