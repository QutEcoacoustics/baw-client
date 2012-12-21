"use strict";

function SitesCtrl($scope, $resource, Site) {
    $scope.sitesResource = $resource('/sites', {});
    $scope.sites = $scope.sitesResource.query();

    $scope.links = function(key) {
        return SitesCtrl.linkList(this.site.id)[key];
    };

    $scope.delete = function(id) {
        alert("deleting site {0}!".format(id));
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

    $scope.site = siteResource.get(routeArgs, function () {
        $scope.links = SitesCtrl.linkList($scope.site.id);

        $scope.site.latitude = +($scope.site.latitude);
        $scope.site.longitude = +($scope.site.longitude);

        $scope.original = angular.copy($scope.site);
    });

    $scope.links = {};

    $scope.delete = function() {
        var doit = confirm("deleting site {0}!".format(this.site.id));
        if (doit) {
            siteResource.remove();
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
            console.log("Updating Site: success.");
            $scope.original = angular.copy($scope.site);
        }, function() { console.log("Updating Site: failed.")} );
    };
}

SiteCtrl.$inject = ['$scope', '$resource', '$routeParams', 'Project', 'Site', 'AudioRecording'];