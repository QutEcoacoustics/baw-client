var bawds = bawds || angular.module("bawApp.directives", [
        "bawApp.configuration",
        "bawApp.directives.ui.bootstrap",
        "bawApp.directives.formChildrenHack"]);

bawds.directive("positionLine", function () {


    return {
        restrict: "A",
        templateUrl: "annotationViewer/positionLine.tpl.html",
        replace: true,
        link: function (scope, elements, attributes, controller) {

            scope.positionLine = function () {
                if (!this.model.audioElement || !this.media) {
                    return 0;
                }

                var durationSeconds = (this.media.commonParameters.endOffset - this.media.commonParameters.startOffset);
                var fractionCompleted = this.model.audioElement.position / durationSeconds;
                fractionCompleted = (fractionCompleted > 1) ? 1 : fractionCompleted;
                var totalPixels = durationSeconds * this.media.spectrogram.ppms * 1000;
                var pixelOffset = totalPixels * fractionCompleted;
                return Math.round(pixelOffset);

            };


        }
    };


});