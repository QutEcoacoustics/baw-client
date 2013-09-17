"use strict";

function BookmarksCtrl($scope, $resource, Bookmark) {
    $scope.bookmarksResource = $resource('/bookmarks', {});
    $scope.bookmarks = $scope.bookmarksResource.query();

    $scope.links = function(key) {
        return BookmarksCtrl.linkList(this.bookmark.id)[key];
    };

    $scope.delete = function(id) {
        alert("deleting bookmark {0}!".format(id));
    };
}

BookmarksCtrl.linkList = function (id) {
    return {
        edit: '/bookmarks/' + id + '/edit',
        details: '/bookmarks/' + id
    };
};

BookmarksCtrl.$inject = ['$scope', '$resource', 'Bookmark'];

function BookmarkCtrl($scope, $resource, $routeParams, Bookmark) {
}

BookmarkCtrl.$inject = ['$scope', '$resource', '$routeParams', 'Bookmark'];
