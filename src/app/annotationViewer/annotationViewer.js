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
                        $scope.gridConfig.y.showScale =
                            $scope.gridConfig.y.showGrid = true;
            }
            else {
                $scope.gridConfig.x.showScale =
                    $scope.gridConfig.x.showGrid =
                        $scope.gridConfig.y.showScale =
                            $scope.gridConfig.y.showGrid = false;
            }
        });

        // set common/sensible defaults, but hide the elements
        $scope.gridConfig = {
            y: {
                showGrid: false,
                showScale: false,
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


        var emptyTag = {
            text: "<no tags>",
            typeOfTag: ""
        };
        $scope.getTag = function getTag(annotation) {

            // which tag to show?
            // common name, then species_name, then if all else fails... whatever is first

            var tags = annotation.tags;

            if (!tags || tags.length === 0) {
                return emptyTag;
            }

            var first = tags[0];


            // optimise for most common case
            // also: on load, only incomplete tags will be listed --> the tag resolver then runs for every tag, just below
            if (first.typeOfTag == baw.Tag.tagTypes.commonName) {
                return first;
            }
            else {
                var commonName, speciesName, firstOther;
                tags.forEach(function (value) {


                    if (value.typeOfTag == baw.Tag.tagTypes.commonName && !commonName) {
                        commonName = value;
                    }
                    if (value.typeOfTag == baw.Tag.tagTypes.speciesName && !speciesName) {
                        speciesName = value;
                    }
                    if (!firstOther) {
                        firstOther = value;
                    }
                });

                return commonName || speciesName || firstOther;
            }
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






