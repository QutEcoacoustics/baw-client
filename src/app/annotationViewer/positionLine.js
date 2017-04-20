angular
    .module("bawApp.annotationViewer.positionLine", [])
    .directive("positionLine", ["bawApp.unitConverter", "$window", function (unitConverter, $window) {

        return {
            restrict: "A",
            templateUrl: "annotationViewer/positionLine.tpl.html",
            replace: false,
            scope: {
                media: "=media",
                audioData: "=audioData"
            },
            controller: ["$scope", "$element", "lodash", function (scope, element, _) {

                var self = this;
                self.containerWidth = 0;

                self.updateContainerWidth = function () {
                    var container = element[0].parentElement;
                    self.containerWidth = (container.clientWidth > 0) ? container.clientWidth : 1;

                };

                self.getWidth = function () {
                    if (self.containerWidth < 2) {
                        self.updateContainerWidth();
                    }
                    return self.containerWidth;
                };

                /**
                 * converts the proportion of elapsed audio to a pixel value,
                 * based on the width of the containing element of the position line, which should match the width of the spectrogram image.
                 * @param audioPositionSeconds number
                 * @returns number
                 * @TODO: can we use the unit converter for this?
                 */
                self.secondsToPixels = function (audioPositionSeconds) {
                    var width = self.getWidth() * (self.secondsToRatio(audioPositionSeconds));
                    return Math.min(width, self.getWidth());
                };

                self.pixelsToSeconds = function (numPixels) {
                    return (numPixels / self.getWidth()) * self.audioDuration();
                };

                /**
                 * Converts a number of seconds of elapsed audio to the fraction of the audio that has elapsed
                 * by dividing by the duration of the audio.
                 * @param audioPositionSeconds number
                 * @returns {number} range [0,1]
                 */
                self.secondsToRatio = function (audioPositionSeconds) {
                    var positionRatio = audioPositionSeconds / self.audioDuration();
                    return Math.min(1, positionRatio);
                };

                self.ratioToSeconds = function (ratio) {
                    return self.audioDuration() * ratio;
                };

                self.audioDuration = function () {
                    if (scope.media && scope.media.endOffset) {
                        return scope.media.endOffset - scope.media.startOffset;
                    } else {
                        return 0.001;
                    }
                };

                /**
                 * gets the offset as either percent or pixel value.
                 * uses the ratio position of the audioData to the total duration (based on the media start and end offset)
                 * @param boolean usePercent
                 * @returns string if usePercent otherwise float
                 */
                self.getOffset = function () {
                    if (typeof(this.audioData) === "object") {
                        return(self.secondsToPixels(this.audioData.position));
                    } else {
                        return 0;
                    }
                };

                self.updateScope = _.throttle(function updateScope() {
                    if (scope.$parent.$parent.$$phase) {
                        return;
                    }
                    scope.$parent.$parent.$digest();
                }, 250);

                scope.getOffset = self.getOffset;

            }],
            link: {
                pre: function (scope, elements, attributes, controller) {

                    scope.dragOptions = {
                        axis: "x",
                        containment: true,
                        useLeftTop: false,
                        dragEnd: function dragEndSetPosition (dragscope, draggie, event, pointer) {
                            scope.audioData.position = controller.pixelsToSeconds(draggie.position.x);
                            controller.updateScope();
                        },
                        dragMove: function dragMoveSetPosition(dragscope, draggie, event, pointer) {
                            scope.audioData.position = controller.pixelsToSeconds(draggie.position.x);
                            controller.updateScope();
                        }
                    };
                },
                post: function (scope, elements, attributes, controller) {

                    angular.element($window).on("resize", function () {
                        controller.updateContainerWidth();
                        scope.$apply();
                    });

                }


            }



        };


    }]);