angular
    .module("bawApp.annotationViewer.positionLine", [])
    .directive("positionLine", ["bawApp.unitConverter", "$window", function (unitConverter, $window) {

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


            angular.element($window).on("resize", function () {
                //scope.updateConverters(scope.media);
                scope.$apply();
            });

            scope.positionLine = function () {
                return(scope.secondsToPixels(this.audioData.position));



            };

        }
    };


}]);