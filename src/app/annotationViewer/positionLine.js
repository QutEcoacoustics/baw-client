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
                imageClass: "<imageClass"
            },
            link: function (scope, elements, attributes, controller) {

                var image;

                scope.converters = false;



                /**
                 * Searches for the closest node to the position line element that has the class
                 * scope.imageClass
                 * @param element
                 * @returns DOM element or NULL
                 */
                this.getImageElement = function (element, depth) {

                    if (depth > 3 || element.tagName === "BODY") {
                        return null;
                    }

                    var containingElement = element.parentElement;
                    var images = containingElement.getElementsByClassName(scope.imageClass);
                    if (images.length > 0) {
                        return images[0];
                    } else {
                        return this.getImageElement(containingElement, depth + 1);
                    }
                };

                if (scope.imageClass !== undefined) {
                    image = this.getImageElement(elements[0], 0);
                } else {
                    image = null;
                }


                scope.secondsToPixels = function (audioPositionSeconds) {
                    var pixelPosition, imageWidth;

                        if (image.clientWidth > 0) {
                            imageWidth = image.clientWidth;
                        } else {
                            // use number of columns of spectrogram as image width
                            imageWidth = 1;
                        }

                        pixelPosition = imageWidth * (scope.secondsToRatio(audioPositionSeconds));

                    return pixelPosition;
                };


                scope.secondsToRatio = function (audioPositionSeconds) {
                    if (scope.media && scope.media.endOffset) {
                        return audioPositionSeconds / (scope.media.endOffset - scope.media.startOffset);
                    }
                    return 0;

                };



                angular.element($window).on("resize", function () {
                    //scope.updateConverters(scope.media);
                    scope.$apply();
                });

                scope.getOffset = function (usePercent) {

                    if (typeof(this.audioData) === "object") {
                        if (usePercent) {

                            var percent = scope.secondsToRatio(this.audioData.position) * 100;
                            percent = percent > 100 ? 100 : percent;

                            return percent + "%";
                        } else {
                            return(scope.secondsToPixels(this.audioData.position));
                        }

                    } else {
                        return 0;
                    }

                };





            }
        };


    }]);