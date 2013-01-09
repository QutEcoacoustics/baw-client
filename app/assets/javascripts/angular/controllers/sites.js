"use strict";

function SitesCtrl($scope, $resource, Site) {
    $scope.sitesResource = $resource('/sites', {});
    $scope.sites = $scope.sitesResource.query();

    $scope.links = function(key) {
        return SitesCtrl.linkList(this.site.id)[key];
    };
}

SitesCtrl.linkList = function (id) {
    return {
        edit: '/sites/' + id + '/edit',
        details: '/sites/' + id
    };
};

SitesCtrl.$inject = ['$scope', '$resource', 'Site'];

function SiteCtrl($scope, $resource, $routeParams, Project, Site, AudioRecording) {
    var siteResource = Site;
    var routeArgs = {siteId: $routeParams.siteId};

    $scope.editing = $routeParams.editing === "edit";

    $scope.site = siteResource.get(routeArgs, function () {
        $scope.links = SitesCtrl.linkList($scope.site.id);

        $scope.site.latitude = +($scope.site.latitude);
        $scope.site.longitude = +($scope.site.longitude);

        $scope.original = angular.copy($scope.site);
    });

    $scope.links = {};

    $scope.delete = function() {
        var doit = confirm("Are you sure you want to delete this site (id {0})?".format(this.site.id));
        if (doit) {
            siteResource.remove(this.site.id, function(){ console.log('success')}, function(){ console.log('error')});
        }
    };

    $scope.reset = function() {
        $scope.site = angular.copy($scope.original);
    };

    $scope.update = function updateSite() {
        // do not send back the full object for update
        var p = { "site": {} };
        p.site.name = $scope.site.name;
        p.site.notes = $scope.site.notes;

        siteResource.update(routeArgs, p,  function() {
            $scope.original = angular.copy($scope.site);
            var msg = "Site details updated successfully.";
            console.log(msg); alert(msg);
        }, function() {
            var msg = "There was a problem updating the site details. Please check for errors and try again.";
            console.log(msg); alert(msg);
        });
    };
}

SiteCtrl.$inject = ['$scope', '$resource', '$routeParams', 'Project', 'Site', 'AudioRecording'];