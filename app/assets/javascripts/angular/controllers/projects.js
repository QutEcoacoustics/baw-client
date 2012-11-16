"use strict";


function ProjectsCtrl($scope, $resource) {
    $scope.projectsResource = $resource('/projects', {});
    $scope.projects = $scope.projectsResource.query();

    $scope.links = function(key) {
        return ProjectsCtrl.linkList(this.project.id)[key];
    };

    $scope.delete = function(id) {
        alert("deleting project {0}!".format(id));
    };
}

ProjectsCtrl.linkList = function (id) {
    return {
        edit: '/projects/' + id + '/edit',
        details: '/projects/' + id
    };
};

ProjectsCtrl.$inject = ['$scope', '$resource'];


function ProjectCtrl($scope, $resource, $routeParams) {

    var projectResource = $resource('/projects/:projectId', {projectId: $routeParams.projectId});

    $scope.editing = $routeParams.editing === "edit";

    $scope.project = projectResource.get(function () {
        $scope.links = ProjectsCtrl.linkList($scope.project.id);

        if ($scope.editing) {
            $scope.original = this;
        }
    });



    $scope.links = {};

    $scope.delete = function() {
        var doit = confirm("deleting project {0}!".format(this.project.id));
        if (doit) {
            projectResource.remove();
        }
    };

    $scope.reset = function() {
        $scope.project = $scope.original;
    };

    $scope.update = function updateProject() {
        projectResource.save();
    };

}

ProjectCtrl.$inject = ['$scope', '$resource', '$routeParams'];

