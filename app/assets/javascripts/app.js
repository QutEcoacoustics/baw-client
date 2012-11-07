'use strict';

/* App Module */

var bawApp = angular.module('baw', ['ngResource'], function($routeProvider, $locationProvider ) {

    // routes
    $routeProvider.
        when('/home', {templateUrl: '/assets/home.html',   controller: HomeCtrl}).

        when('/projects', {templateUrl: '/assets/projects.html', controller: ProjectCtrl}).
        when('/projects/:projectId', {templateUrl: '/assets/project.html', controller: ProjectsCtrl}).

        when('/sites', {templateUrl: '/assets/sites.html',   controller: SitesCtrl }).
        when('/sites/:siteId', {templateUrl: '/assets/site.html', controller: SiteCtrl }).

        when('/photos', {templateUrl: '/assets/photos.html',   controller: PhotosCtrl }).
        when('/photos/:photoId', {templateUrl: '/assets/photo.html', controller: PhotoCtrl }).

        when('/recordings', {templateUrl: '/assets/recordings.html',   controller: RecordingsCtrl }).
        when('/recordings/:recordingId', {templateUrl: '/assets/recording.html', controller: RecordingCtrl }).

        when('/listen', {templateUrl: '/assets/listen.html', controller: ListenCtrl}).
        when('/listen/:recordingId', {templateUrl: '/assets/listen.html', controller: ListenCtrl}).

        //when('/phones/:phoneId', {templateUrl: 'partials/phone-detail.html', controller: PhoneDetailCtrl}).
        otherwise({redirectTo: '/home'});

    // location config
    $locationProvider.html5Mode(true);



});
