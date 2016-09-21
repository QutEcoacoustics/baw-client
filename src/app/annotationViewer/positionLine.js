var bawds = bawds || angular.module("bawApp.directives", [
        "bawApp.configuration",
        "bawApp.directives.ui.bootstrap",
        "bawApp.directives.formChildrenHack"]);

bawds.directive("positionLine", ["bawApp.unitConverter", function (unitConverter) {

    return {
        restrict: "A",
        templateUrl: "annotationViewer/positionLine.tpl.html",
        replace: true,
        scope: {
            media: "<media",
            audioData: "<audioData",
            imageSelector: "<imageId"
        },
        link: function (scope, elements, attributes, controller) {

            scope.converters = false;

            scope.$watch(function () { return scope.media; }, function (newValue, oldValue) {

                if (newValue.sampleRate) {
                    scope.converters = unitConverter.getConversions({
                        sampleRate: newValue.sampleRate,
                        spectrogramWindowSize: newValue.spectrogram ? newValue.spectrogram.windowSize : null,
                        endOffset: newValue.endOffset,
                        startOffset: newValue.startOffset,
                        imageElement: angular.element( document.querySelector( scope.imageSelector ) ),
                        audioRecordingAbsoluteStartDate: newValue.recordedDate
                    });
                }

            });




            scope.positionLine = function () {

                if (!this.audioData || !this.media) {
                    console.log("no audio data or no media");
                    return 0;
                }

                if (scope.converters) {

                    console.log("ready to convert stuff!");
                    return(scope.converters.secondsToPixels(this.audioData.position));

                }

                // todo: use unit converter
                // var durationSeconds = (this.media.commonParameters.endOffset - this.media.commonParameters.startOffset);
                // var fractionCompleted = this.audioData.position / durationSeconds;
                // fractionCompleted = (fractionCompleted > 1) ? 1 : fractionCompleted;
                // var totalPixels = durationSeconds * this.media.spectrogram.ppms * 1000;
                // var pixelOffset = totalPixels * fractionCompleted;
                // return Math.round(pixelOffset);

            };

        }
    };


}]);