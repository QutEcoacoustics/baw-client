'use strict';

/* App Module */

angular.module('baw', [], function($routeProvider, $locationProvider ) {

    // routes
    $routeProvider.
        when('/home', {templateUrl: 'assets/home.html',   controller: HomeCtrl}).
        when('/projects', {templateUrl: 'assets/project.html', controller: ProjectCtrl}).
        when('/site', {templateUrl: 'assets/site.html', controller: SiteCtrl}).
        //when('/phones/:phoneId', {templateUrl: 'partials/phone-detail.html', controller: PhoneDetailCtrl}).
        otherwise({redirectTo: '/home'});

    // location config
    $locationProvider.html5Mode(true);

});
