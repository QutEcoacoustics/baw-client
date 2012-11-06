"use strict";
function PhotosCtrl($scope, $resource) {
    $scope.photosResource = $resource('/photos', {}, { get: { method:'GET', params:{}, isArray: true }});
    $scope.photos = $scope.photosResource.get();
}

PhotosCtrl.$inject = ['$scope', '$resource'];