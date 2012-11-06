"use strict";
function SitesCtrl($scope, $resource) {
    $scope.sitesResource = $resource('/sites', {}, { get: { method:'GET', params:{}, isArray: true }});
    $scope.sites = $scope.sitesResource.get();
}

SitesCtrl.$inject = ['$scope', '$resource'];