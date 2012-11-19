/* http://docs.angularjs.org/#!angular.service */

//angular.service('Photographers', function($resource) {
//    return $resource('photographers/:photographer_id', {},
//        { 'index': { method: 'GET', isArray: true }});
//});
//
//angular.service('Galleries', function($resource) {
//    return $resource('photographers/:photographer_id/galleries/:gallery_id', {},
//        { 'index': { method: 'GET', isArray: true }});
//});
//
//angular.service('Photos', function($resource) {
//    return $resource('photographers/:photographer_id/galleries/:gallery_id/photos', {},
//        { 'index': { method: 'GET', isArray: true }});
//});
//
//angular.service('SelectedPhotos', function($resource) {
//    return $resource('selected_photos/:selected_photo_id', {},
//        { 'create': { method: 'POST' },
//            'index': { method: 'GET', isArray: true },
//            'update': { method: 'PUT' },
//            'destroy': { method: 'DELETE' }});
//});

(function() {
    function resourcePut($resource, path, paramDefaults, actions) {
        var a = actions || {};
        a.update = {method: 'PUT'};
        return $resource(path, paramDefaults, a);
    }

    var bawss = angular.module("baw.services", ['ngResource']);

    //function addPut

    bawss.factory('Project', function($resource) {
        return resourcePut($resource, '/projects/:projectId', {projectId: "@projectId"});
    });

//    var projectResource = $resource('/projects/:projectId', {projectId: '@id'}, {
//        get: { method:'GET', params:{projectId: '@id'}, isArray: false }
//    });
//
//    baws.factory('projects', function(){
//        var projectsService;
//
//        return projectsService;
//    });

})();