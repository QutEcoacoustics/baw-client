var acds = acds || angular.module('audio-control', []);

/**
 * A directive for binding the volume of an audio element to some DOM.
 *
 */
bawds.directive('volumeControl', ['$parse', function ($parse) {
    return {
        restrict: "E",
        scope: {
            ngAudio: "="
        },
        templateUrl: "audioControl/volumeControl.tpl.html",
        link: function(scope, element, attrs,  controller, transcludeFunc) {

            // get instances of the mute button and the slider
            var muteButton = null,
                slider = null;

            // set up binding
            scope.$watch("expression", function volumeChanged(newValue, oldValue) {

            });

            scope.$watch("expression", function mutedChanged(newValue, oldValue) {

            });

            // bind from the inputs to the model
            muteButton.click = function() {

            };

            slider.click(function() {

            });
        }
    }
}]);