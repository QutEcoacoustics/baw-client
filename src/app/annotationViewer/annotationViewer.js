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

        $scope.gridConfig = {
            y: {
                show: true,
                max: 356,
                min: 100,
                step: 50,
                numberOfLines: null,
                offset: 10
            },
            x: {
                show: true,
                max: 60,
                min: 30,
                step: 5,
                numberOfLines: 10,
                offset: 0
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


        // updated in directive
        $scope.model.converters = $scope.model.converters || {};
    }]);






