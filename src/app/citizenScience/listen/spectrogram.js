angular.module("bawApp.spectrogram", [])
    .directive("spectrogram", ["$rootScope", function ($rootScope) {
        return {
            restrict: "A",
            link: function ($scope, element, attributes) {
                element.bind("load", function() {
                    $rootScope.$broadcast("spectrogram-loaded", $scope);

                });
                element.bind("error", function(){
                    console.log("spectrogram could not be loaded");
                });
            }
        };
    }]);