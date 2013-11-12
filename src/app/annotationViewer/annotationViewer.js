var avModule = angular.module('bawApp.annotationViewer', []);

avModule.controller('AnnotationViewerCtrl', ['$scope', '$element', '$attrs', '$transclude', 'Tag',
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
        $scope.getTag = function getTag(annotation) {

            // which tag to show
            // HACK: show first only
            var taggings = annotation.taggings;

            if (!taggings || taggings.length === 0) {
                return "<no tags>";
            }

            var tag = taggings ? taggings[0] : undefined;
            var id = tag ? tag.id : undefined;

            var tagObject = Tag.resolve(id);
            if (tagObject) {
                return tagObject.text;
            }
            else {
                return "<unknown>";
            }
        };

        $scope.positionLabel = function (audioEvent) {
            return $scope.model.converters.secondsToPixels(audioEvent.startTimeSeconds);
        };

        $scope.positionLine = function () {
            return $scope.model.converters.secondsToPixels($scope.model.audioElement.position);
        };


        // updated in directive
        $scope.model.converters = $scope.model.converters || {};
    }]);






