var bawds = bawds || angular.module("bawApp.directives", [
        "bawApp.configuration",
        "bawApp.directives.ui.bootstrap",
        "bawApp.directives.formChildrenHack"]);

bawds.directive("positionLine", function () {

    return {
        restrict: "A",
        templateUrl: "annotationViewer/positionLine.tpl.html",
        replace: true,
        scope: {
            media: "<media",
            audioData: "<audioData"
        },
        link: function (scope, elements, attributes, controller) {

            scope.positionLine = function () {

                if (!this.audioData || !this.media) {
                    console.log("no audio data or no media");
                    return 0;
                }

                // todo: use unit converter
                var durationSeconds = (this.media.commonParameters.endOffset - this.media.commonParameters.startOffset);
                var fractionCompleted = this.audioData.position / durationSeconds;
                fractionCompleted = (fractionCompleted > 1) ? 1 : fractionCompleted;
                var totalPixels = durationSeconds * this.media.spectrogram.ppms * 1000;
                var pixelOffset = totalPixels * fractionCompleted;
                return Math.round(pixelOffset);

            };

        }
    };


});