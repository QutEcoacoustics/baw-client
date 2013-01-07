"use strict";

function TagsCtrl($scope, $resource, Tag) {
    $scope.tagsResource = $resource('/tags', {});
    $scope.tags = $scope.tagsResource.query();

    $scope.links = function(key) {
        return TagsCtrl.linkList(this.tag.id)[key];
    };

    $scope.delete = function(id) {
        alert("deleting tag {0}!".format(id));
    };
}

TagsCtrl.linkList = function (id) {
    return {
        edit: '/tags/' + id + '/edit',
        details: '/tags/' + id
    };
};

TagsCtrl.$inject = ['$scope', '$resource', 'Tag'];

function TagCtrl($scope, $resource, $routeParams, Tag) {

}

TagCtrl.$inject = ['$scope', '$resource', '$routeParams', 'Tag'];
