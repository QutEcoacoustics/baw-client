"use strict";
function ProjectsCtrl($scope, $resource) {
    $scope.projectsResource = $resource('/projects', {}, { get: { method:'GET', params:{}, isArray: true }});
    $scope.projects = $scope.projectsResource.get();
}

ProjectsCtrl.$inject = ['$scope', '$resource'];