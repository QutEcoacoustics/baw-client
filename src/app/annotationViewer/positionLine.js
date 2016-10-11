var bawds = bawds || angular.module("bawApp.directives", [
        "bawApp.configuration",
        "bawApp.directives.ui.bootstrap",
        "bawApp.directives.formChildrenHack"]);

bawds.directive("positionLine", ["bawApp.unitConverter", "$window", function (unitConverter, $window) {

    return {
        restrict: "A",
        templateUrl: "annotationViewer/positionLine.tpl.html",
        replace: true,
        scope: {
            media: "<media",
            audioData: "<audioData",
            imageId: "<imageId"
        },
        link: function (scope, elements, attributes, controller) {

            scope.converters = false;

            var image = document.querySelector("#"+scope.imageId);
            //var image = angular.element("#"+scope.imageId);

            // scope.$watch(function () { return scope.media; }, function (newValue, oldValue) {
            //         scope.updateConverters(newValue);
            // });

            // scope.$watch("image.clientWidth", function () {
            //     scope.updateConverters();
            // });
            //
            //
            // scope.updateConverters = function (media) {
            //
            //     if (!media || !media.startOffset) {
            //         return;
            //     }
            //
            //     // scope.converters = unitConverter.getConversions({
            //     //     sampleRate: media.sampleRate,
            //     //     spectrogramWindowSize: media.spectrogram ? media.spectrogram.windowSize : null,
            //     //     endOffset: media.endOffset,
            //     //     startOffset: media.startOffset,
            //     //     imageElement: image,
            //     //     audioRecordingAbsoluteStartDate: media.recordedDate
            //     // });
            //
            //     var data = {
            //         endOffset: media.endOffset,
            //         startOffset: media.startOffset,
            //         imageElement: image
            //     };
            //
            //     scope.converters = (function (data) {
            //         var duration = data.endOffset - data.startOffset;
            //         var imageWidth = data.imageElement.clientWidth;
            //         return {
            //             secondsToPixels: function (audioPositionSeconds) {
            //
            //                 var pixelPosition = imageWidth * (audioPositionSeconds / duration);
            //                 return pixelPosition;
            //
            //             }
            //         };
            //     }(data));
            //
            //     console.log("converters", scope.converters);
            //
            // };

            scope.secondsToPixels = function (audioPositionSeconds) {
                var pixelPosition, imageWidth;


                if (scope.media && scope.media.endOffset) {

                    if (image.clientWidth > 0) {
                        imageWidth = image.clientWidth;
                    } else {
                        // use number of colums of spectrogram as image width
                        imageWidth = 1;
                    }

                    pixelPosition = imageWidth * (audioPositionSeconds / (scope.media.endOffset - scope.media.startOffset));
                } else {
                    pixelPosition = 0;
                }
                return pixelPosition;
            };


            // scope.getImageWidth = function () {
            //     return image.clientWidth;
            // };
            //
            // scope.$watch(scope.getElementDimensions, function () {
            //     scope.updateConverters(scope.media);
            // }, true);

            angular.element($window).on("resize", function () {
                //scope.updateConverters(scope.media);
                scope.$apply();
            });

            scope.positionLine = function () {
                return(scope.secondsToPixels(this.audioData.position));

                // if (image.clientWidth === 0) {
                //     scope.updateConverters(scope.media);
                // }

                // if (scope.converters) {
                //     return(scope.secondsToPixels(this.audioData.position));
                // } else {
                //     return 0;
                // }

            };

        }
    };


}]);