"use strict";

function ProjectsCtrl($scope, $resource, Project) {
    $scope.projectsResource = $resource('/projects', {});
    $scope.projects = $scope.projectsResource.query();

    $scope.links = function(key) {
        return ProjectsCtrl.linkList(this.project.id)[key];
    };
}

ProjectsCtrl.linkList = function (id) {
    return {
        edit: '/projects/' + id + '/edit',
        details: '/projects/' + id
    };
};

ProjectsCtrl.$inject = ['$scope', '$resource', 'Project'];

function ProjectCtrl($scope, $location, $resource, $routeParams, Project, Site, Photo) {

    var projectResource = Project; //$resource('/projects/:projectId', {projectId: $routeParams.projectId});
    var routeArgs = {projectId: $routeParams.projectId};

    $scope.siteIds = [];

    $scope.editing = $routeParams.editing === "edit";

//    $scope.editMode = function(mode){
//        if(mode){
//            $scope.editing = true;
//            $location.path($location.path()+'/edit');
//        } else {
//            $scope.editing = false;
//        }
//    };

    $scope.project = projectResource.get(routeArgs, function () {
        $scope.links = ProjectsCtrl.linkList($scope.project.id);

        $scope.original = angular.copy($scope.project);

        if($scope.editing) {
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
        }

        //$scope.siteIds.push(($scope.project.sites || []).map(function(value) {return value.id.toString()} );

        //$scope.$apply(function() { $scope.siteIds.push(-1); });
        //$scope.$apply(function() { $scope.siteIds.pop(); });
    });

    $scope.links = {};

    $scope.delete = function() {
        var doit = confirm("Are you sure you want to delete this project (id {0})?".format(this.project.id));
        if (doit) {
            projectResource.remove();
        }
    };

    $scope.deletePhoto = function(photoId){
        var doit = confirm("Are you sure you want to delete this photo (id {0})?".format(photoId));
        if (doit) {

            for(var remPhotoIndex = 0;remPhotoIndex<this.project.photos.length;remPhotoIndex++){
                if(this.project.photos[remPhotoIndex].id === photoId){
                    // remove the element
                    this.project.photos.splice(remPhotoIndex, 1);
                    break;
                }
            }
        }
    };

    $scope.reset = function() {
        if($scope.editing){
            $scope.project = angular.copy($scope.original);
        }
    };

    $scope.update = function updateProject() {
        if($scope.editing){
            // do not send back the full object for update
            var p = { "project": {} };

            p.project.name = $scope.project.name;
            p.project.urn = $scope.project.urn;
            p.project.description = $scope.project.description;
            p.project.notes = $scope.project.notes;

            p.project.siteIds = $scope.siteIds;

            p.project.photos_attributes = [];
            for(var photoindex=0;photoindex<$scope.project.photos.length;photoindex++){
                p.project.photos_attributes[photoindex] = {};
                p.project.photos_attributes[photoindex].uri = $scope.project.photos[photoindex].uri;
                p.project.photos_attributes[photoindex].description = $scope.project.photos[photoindex].description;
                p.project.photos_attributes[photoindex].copyright = $scope.project.photos[photoindex].copyright;
                p.project.photos_attributes[photoindex].id = $scope.project.photos[photoindex].id;
            }

            projectResource.update(routeArgs, p,  function() {
                $scope.original = angular.copy($scope.site);
                var msg = "Project details updated successfully.";
                console.log(msg); alert(msg);
            }, function() {
                var msg = "There was a problem updating the project details. Please check for errors and try again.";
                console.log(msg); alert(msg);
            });
        }
    };

    $scope.allSites = Site.query();
}

ProjectCtrl.$inject = ['$scope', '$location', '$resource', '$routeParams', 'Project', 'Site'];

