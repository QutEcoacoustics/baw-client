var bawCs = angular
    .module('bawApp.annotationLibrary.comments', ['bawApp.configuration'])
    .directive('comments', ['conf.paths', function (paths) {
        var commentDefinition = {
            restrict: 'E',
            templateUrl: paths.site.files.annotationComments,
            link: function postLink(scope, $element, attributes) {
            }
        };
        return commentDefinition;
    }]);