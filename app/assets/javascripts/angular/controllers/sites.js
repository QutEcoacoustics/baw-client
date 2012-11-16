"use strict";
function SitesCtrl($scope, $resource) {
    $scope.sitesResource = $resource('/sites', {}, { get: { method:'GET', params:{}, isArray: true }});
    $scope.sites = $scope.sitesResource.get();
}

SitesCtrl.$inject = ['$scope', '$resource'];



function SiteCtrl($scope, $resource) {

    var siteResource = $resource('/sites/:siteId', {siteId: '@id'}, {
        get: { method:'GET', params:{siteId: '@id'}, isArray: false }
    });

    $scope.site = siteResource.get({siteId:1});


}

SiteCtrl.$inject = ['$scope', '$resource'];