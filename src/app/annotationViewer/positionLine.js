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

                if (newValue && newValue.sampleRate) {
                    scope.converters = unitConverter.getConversions({
                        sampleRate: newValue.sampleRate,
                        spectrogramWindowSize: newValue.spectrogram ? newValue.spectrogram.windowSize : null,
                        endOffset: newValue.endOffset,
                        startOffset: newValue.startOffset,
                        imageElement: null,
                        audioRecordingAbsoluteStartDate: newValue.recordedDate
                    });
                }

            });

            scope.positionLine = function () {


                if (scope.converters) {
                    return(scope.converters.secondsToPixels(this.audioData.position));
                } else {
                    return 0;
                }

            };

        }
    };


}]);