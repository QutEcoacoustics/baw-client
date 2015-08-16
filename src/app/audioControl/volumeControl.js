var acds = acds || angular.module("audio-control", []);

/**
 * A directive for binding the volume of an audio element to some DOM.
 *
 */
acds.directive("volumeControl", ["$parse", function ($parse) {
    return {
        restrict: "E",
        scope: {
            model: "="
        },
        templateUrl: "audioControl/volumeControl.tpl.html",
        link: function(scope, $element, attrs,  controller, transcludeFunc) {

            // get instances of the mute button and the slider
            var element = $element[0],
                muteButton = element.querySelector("#volumeControl-mute"),
                slider = element.querySelector("#volumeControl-slider")
                ;

            // set up binding
            // volume
            scope.$watch(function(){
                return scope.model ? scope.model.volume : null;
            }, function volumeChanged(newValue, oldValue) {
                scope.volume = newValue ? newValue * 100 : null;
            });

            // muted
            scope.$watch(function(){
                return scope.model ? scope.model.muted : null;
            }, function mutedChanged(newValue, oldValue) {
                scope.muted = newValue;
            });

            // bind from the inputs to the model
            muteButton.addEventListener("click", function() {
                scope.$apply(function() {
                    scope.model.muted = !scope.model.muted;
                });
            });

            function sliderChanged() {
                scope.$apply(function() {
                    scope.model.volume = parseFloat(slider.value) / 100;
                });
            }
            slider.addEventListener("input", sliderChanged);
            //slider.click();
        }
    };
}]);