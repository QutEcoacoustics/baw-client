"use strict";

function SiteCtrl($scope, $resource) {

    var siteResource = $resource('/sites/:siteId', {siteId: '@id'}, {
        get: { method:'GET', params:{siteId: '@id'}, isArray: false }
    });

    $scope.site = siteResource.get({siteId:1});
}

SiteCtrl.$inject = ['$scope', '$resource'];