"use strict";
function PhotoCtrl($scope, $resource) {

    var photoResource = $resource('/photos/:photoId', {photoId: '@id'}, {
        get: { method:'GET', params:{photoId: '@id'}, isArray: false }
    });

    $scope.project = photoResource.get({photoId:1});
}

PhotoCtrl.$inject = ['$scope', '$resource']