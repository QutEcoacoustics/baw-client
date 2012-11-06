'use strict';

/* App Module */

var bawApp = angular.module('baw', ['ngResource'], function($routeProvider, $locationProvider ) {

    // routes
    $routeProvider.
        when('/home', {templateUrl: 'assets/home.html',   controller: HomeCtrl}).

        when('/projects', {templateUrl: 'assets/projects.html', controller: ProjectCtrl}).
        when('/project/:projectId', {templateUrl: 'assets/project.html', controller: ProjectsCtrl}).

        when('/sites', {templateUrl: 'assets/sites.html',   controller: SitesCtrl }).
        when('/site/:siteId', {templateUrl: 'assets/site.html', controller: SiteCtrl }).

        when('/photos', {templateUrl: 'assets/photos.html',   controller: PhotosCtrl }).
        when('/photo/:photoId', {templateUrl: 'assets/photo.html', controller: PhotoCtrl }).

        when('/recordings', {templateUrl: 'assets/recordings.html',   controller: RecordingsCtrl }).
        when('/recording/:recordingId', {templateUrl: 'assets/recording.html', controller: RecordingCtrl }).

        //when('/phones/:phoneId', {templateUrl: 'partials/phone-detail.html', controller: PhoneDetailCtrl}).
        otherwise({redirectTo: '/home'});

    // location config
    //$locationProvider.html5Mode(true);



});

bawApp.factory('Todo', ['$resource', function($resource) {
    return $resource('http://localhost:port/todos.json', {port:":3001"} , {
        query: {method: 'GET', isArray: true}
    });
}]);
