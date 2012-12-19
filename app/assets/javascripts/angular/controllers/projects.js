"use strict";


function ProjectsCtrl($scope, $resource, Project) {
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

ProjectsCtrl.$inject = ['$scope', '$resource', 'Project'];


function ProjectCtrl($scope, $resource, $routeParams, Project) {

    var projectResource = Project; //$resource('/projects/:projectId', {projectId: $routeParams.projectId});
    var routeArgs = {projectId: $routeParams.projectId};

    $scope.editing = $routeParams.editing === "edit";

    $scope.project = projectResource.get(routeArgs, function () {
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
        // do not send back the full object for update
        var p = {};
        p.name = this.project.name;
        p.urn = this.project.urn;
        p.description = this.project.description;
        p.notes = this.project.notes;
        p.site_ids = (this.project.sites || []).map(function(value) {return value.id} );

        // validation
        if(!p.name){

        }

        projectResource.update(routeArgs, p,  function() {console.log("success update")}, function() { console.log("failed update")} );
    };

}

ProjectCtrl.$inject = ['$scope', '$resource', '$routeParams', 'Project'];

