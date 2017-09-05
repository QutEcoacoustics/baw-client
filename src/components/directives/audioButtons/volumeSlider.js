var audioButtons = audioButtons || angular.module("bawApp.components.audioButtons", []);



audioButtons.component("volumeSlider", {
    templateUrl: "components/directives/audioButtons/volumeSlider.tpl.html",
    controller: [
        "$scope",
        "AudioEvent",
        "baw.models.AudioEvent",
        function ($scope, AudioEventService, AudioEvent) {

            var self = this;
            $scope.audioElement = self.audioElement;

            $scope.muted = self.audioElement.muted;
            $scope.volume = self.audioElement.volume;
            $scope.displayVolume = self.audioElement.volume * 100;


            // $scope.$watch("displayVolume", function (newVal, oldVal) {
            //
            // });

            $scope.$watch(function () { return self.audioElement.volume; }, function (newVal, oldVal) {
                $scope.displayVolume = newVal * 100;
            });


            // /**
            //  * Update volume value on scope if volume of audioModel changes
            //  * TODO: is this necessary? carried over from componentizing listen page volume directive
            //  */
            // $scope.$watch(function(){
            //     return $scope.audioElement ? $scope.audioElement.volume : null;
            // }, function volumeChanged(newValue, oldValue) {
            //     $scope.audioElement.volume = newValue ? newValue * 100 : null;
            // });

            //
            // /**
            //  * Update muted value on scope when muted value on audioModel changes
            //  * TODO: is this necessary? carried over from componentizing listen-page volume directive
            //  */
            // $scope.$watch(function(){
            //     return $scope.audioElement ? $scope.audioElement.muted : null;
            // }, function mutedChanged(newValue, oldValue) {
            //     //$scope.audioElement.muted = newValue;
            // });

            /**
             * toggles the value for muted on the audio model
             */
            $scope.toggleMute = function () {
                $scope.audioElement.muted = !$scope.audioElement.muted;
            };

            /**
             * changes the value of the volume on the audioModel when the slider is changed
             */
            $scope.sliderChanged = function () {
                self.audioElement.volume = $scope.displayVolume / 100;
            };


        }],
    bindings: {
        audioElement: "="
    }
});

