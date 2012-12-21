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

function ProjectCtrl($scope, $resource, $routeParams, Project, Site) {

    var projectResource = Project; //$resource('/projects/:projectId', {projectId: $routeParams.projectId});
    var routeArgs = {projectId: $routeParams.projectId};

    $scope.siteIds = [];

    $scope.project = projectResource.get(routeArgs, function () {
        $scope.links = ProjectsCtrl.linkList($scope.project.id);

        $scope.original = angular.copy($scope.project);

        // HACK: race condition requires this be done later (not sure what we're racing)
        setTimeout(function(){
            // need ids to pre-populate selector
            var currentSiteIds = $scope.project.sites || [];
            for(var index=0;currentSiteIds.length > index;index++){
                $scope.siteIds.push(currentSiteIds[index].id.toString());
            }

            // HACK: and this too...
            $scope.$apply(function() {  });
            // the timeout required is based on the time to wait to ensure the data is available
        }, 1000);


        //$scope.siteIds.push(($scope.project.sites || []).map(function(value) {return value.id.toString()} );

        //$scope.$apply(function() { $scope.siteIds.push(-1); });
        //$scope.$apply(function() { $scope.siteIds.pop(); });
    });

    $scope.links = {};

    $scope.delete = function() {
        var doit = confirm("deleting project {0}!".format(this.project.id));
        if (doit) {
            projectResource.remove();
        }
    };

    $scope.reset = function() {
        $scope.project = angular.copy($scope.original);
    };

    $scope.update = function updateProject() {
        // do not send back the full object for update
        var p = { "project": {} };
        p.project.name = $scope.project.name;
        p.project.urn = $scope.project.urn;
        p.project.description = $scope.project.description;
        p.project.notes = $scope.project.notes;

        p.project.siteIds = $scope.siteIds;

        projectResource.update(routeArgs, p,  function() {
            console.log("Updating Project: success.");
            $scope.original = angular.copy($scope.project);
        }, function() { console.log("Updating Project: failed.")} );
    };

    $scope.allSites = Site.query();
}

ProjectCtrl.$inject = ['$scope', '$resource', '$routeParams', 'Project', 'Site'];

