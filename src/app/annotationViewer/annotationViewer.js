var avModule = angular.module('bawApp.annotationViewer', []);

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


        // updated in directive
        $scope.model.converters = $scope.model.converters || {};
    }]);






