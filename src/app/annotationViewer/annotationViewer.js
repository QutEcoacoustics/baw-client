var avModule = angular.module('bawApp.annotationViewer', ['bawApp.annotationViewer.gridLines']);

avModule.controller('AnnotationViewerCtrl', ['$scope', '$element', '$attrs', '$transclude', 'Tag',

    // TODO: possible optimisation evaluate these functions once per frame

    /**
     * The AnnotationViewer controller
     * @param $scope
     * @param $element
     * @param $attrs
     * @param $transclude
     * @constructor
     * @param Tag
     */
        function AnnotationViewerCtrl($scope, $element, $attrs, $transclude, Tag) {

        $scope.$watch(function () {
            // updated in directive
            return $scope.model.converters;
        }, function (newValue, oldValue) {
            if (newValue && newValue.conversions.enforcedImageWidth && newValue.conversions.enforcedImageHeight) {
                $scope.gridConfig.x.width = newValue.conversions.enforcedImageWidth;
                $scope.gridConfig.x.min = newValue.input.startOffset;
                $scope.gridConfig.x.max = newValue.input.endOffset;


                $scope.gridConfig.y.height = newValue.conversions.enforcedImageHeight;
                $scope.gridConfig.y.min = 0;
                $scope.gridConfig.y.max = newValue.conversions.nyquistFrequency;

                $scope.gridConfig.x.showScale =
                    $scope.gridConfig.x.showGrid =
                        $scope.gridConfig.x.showTitle =
                            $scope.gridConfig.y.showScale =
                                $scope.gridConfig.y.showGrid =
                                    $scope.gridConfig.y.showTitle =
                                        true;
            }
            else {
                $scope.gridConfig.x.showScale =
                    $scope.gridConfig.x.showGrid =
                        $scope.gridConfig.x.showTitle =
                            $scope.gridConfig.y.showScale =
                                $scope.gridConfig.y.showGrid =
                                    $scope.gridConfig.y.showTitle =
                                        false;
            }
        });

        // set common/sensible defaults, but hide the elements
        $scope.gridConfig = {
            y: {
                showGrid: false,
                showScale: false,
                showTitle: false,
                max: 11025,
                min: 0,
                step: 1000,
                height: 256,
                labelFormatter: function(value, index, min, max) {
                    return (value / 1000).toFixed(1);
                },
                title: "Frequency (KHz)"
            },
            x: {
                showGrid: false,
                showScale: false,
                showTitle: false,
                max: 30,
                min: 0,
                step: 1,
                width: 1292,
                labelFormatter: function(value, index, min, max) {
                    // show 'absolute' time.... i.e. seconds of the minute
                    var offset = (value % 60);

                    return (offset).toFixed(0);
                },
                title: "Time offset (seconds)"
            }
        };

        $scope.getTag = function(annotation){
            return Tag.selectSinglePriorityTag(annotation.tags);
        };

        $scope.positionLabel = function (audioEvent) {
            return $scope.model.converters.toLeft(audioEvent.startTimeSeconds);
        };

        $scope.positionLine = function () {
            return $scope.model.converters.secondsToPixels($scope.model.audioElement.position);
        };

        var updateScope = _.throttle(function updateScope() {
            console.debug("annotationViewer:updateScope: digest triggered");

            if ($scope.$parent.$parent.$$phase) {
                return;
            }

            $scope.$parent.$parent.$digest();
        }, 250);

        $scope.dragOptions = {
            axis: 'x',
            containment: true,
            useLeftTop: false,
            dragMove: function dragMoveSetPosition(scope, draggie, event, pointer) {

                var position = $scope.model.converters.pixelsToSeconds(draggie.position.x);

                $scope.model.audioElement.position = position;

                // using a delayed digest instead of apply improves the animation performance of the dragging
                // substantially... it's also a ugly hack (and if you care to notice, the current time
                // number updates more choppily, every 200ms to be precise
                // we could remove all of this if the $apply was faster!
                //$scope.$apply();
                console.debug("annotationViewer:updateScope: digest delayed");

                updateScope();
            }
        };
    }]);






