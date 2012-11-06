"use strict";
function ProjectCtrl($scope, $resource) {

    var projectResource = $resource('/projects/:projectId', {projectId: '@id'}, {
        get: { method:'GET', params:{projectId: '@id'}, isArray: false }
    });

    $scope.project = projectResource.get({projectId:1});
}

ProjectCtrl.$inject = ['$scope', '$resource'];