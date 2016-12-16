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
                // TODO: remove this binding
                imageClass: "<imageClass"
            },
            link: function (scope, elements, attributes, controller) {

                // the dom element for the spectrogram image that is used to get
                // the width to calculate the pixel offset for the position line
                // TODO: remove the need to reference an image element.
                var image;

                /**
                 * Searches for the closest node to the position-line element that
                 * has the class scope.imageClass
                 * If there are multiple spectrograms on the page, for example generated in a loop,
                 * this ensures that each position line is using the correct spectrogram image.
                 * Searches for the class in the parent dom element, and if not found recurses up one level of dom and repeats.
                 * @param element; the current element in the recursion that is being searched
                 * @param depth; int, the current level of recursion, in order to limit the search
                 * @returns DOM element or NULL
                 * @TODO: deprecated. We don't want to be searching for DOM elements here. Better to bind to data.
                 *
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


                /**
                 * converts the proportion of elapsed audio to a pixel value,
                 * based on the width of the spectrogram image.
                 * @param audioPositionSeconds number
                 * @returns number
                 * @TODO: remove this. Better to use the unit converter, and also better if we don't need to reference the dom element
                 */
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


                /**
                 * Converts a number of seconds of elapsed audio to the fraction of the audio that has elapsed
                 * by dividing by the duration of the audio.
                 * @param audioPositionSeconds number
                 * @returns {number} range [0,1]
                 */
                scope.secondsToRatio = function (audioPositionSeconds) {
                    if (scope.media && scope.media.endOffset) {
                        var positionRatio = audioPositionSeconds / (scope.media.endOffset - scope.media.startOffset);
                        return (positionRatio > 1) ? 1 : positionRatio;
                    }
                    return 0;

                };


                /**
                 * gets the offset as either percent or pixel value.
                 * uses the ratio position of the audioData to the total duration (based on the media start and end offset)
                 * @param boolean usePercent
                 * @returns string if usePercent otherwise float
                 */
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

                if (scope.imageClass !== undefined) {
                    image = this.getImageElement(elements[0], 0);
                } else {
                    image = null;
                }

                angular.element($window).on("resize", function () {
                    scope.$apply();
                });

            }
        };


    }]);