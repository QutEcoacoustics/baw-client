angular.module('bawApp.tags', [])

    .controller('TagsCtrl', ['$scope', '$resource', '$routeParams', 'Tag',

        function TagsCtrl($scope, $resource, $routeParams, Tag) {
            $scope.tagsResource = $resource('/tags', {});
            $scope.tags = $scope.tagsResource.query();

            $scope.links = function (key) {
                return TagsCtrl.linkList(this.tag.id)[key];
            };

            $scope["delete"] = function (id) {
                alert("deleting tag {0}!".format(id));
            };
        }])

    .controller('TagCtrl', ['$scope', '$resource', '$routeParams', 'Tag',


        function TagCtrl($scope, $resource, $routeParams, Tag) {

        }]);
