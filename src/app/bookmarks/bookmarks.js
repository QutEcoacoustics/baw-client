angular.module('bawApp.bookmarks', [])

    .controller('BookmarksCtrl',
        ['$scope', '$resource', 'Bookmark',
            function BookmarksCtrl($scope, $resource, Bookmark) {
                $scope.bookmarksResource = $resource('/bookmarks', {});
                $scope.bookmarks = $scope.bookmarksResource.query();

                $scope.links = function (key) {
                    return BookmarksCtrl.linkList(this.bookmark.id)[key];
                };

                $scope["delete"] = function (id) {
                    alert("deleting bookmark {0}!".format(id));
                };
            }])
    .controller('BookmarkCtrl',
        ['$scope', '$resource', '$routeParams', 'Bookmark',
            function AudioEventCtrl($scope, $resource, $routeParams, Bookmark) {

            }]);