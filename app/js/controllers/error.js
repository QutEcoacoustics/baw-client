"use strict";

//angular.module('home', []).config(function ($routeProvider, $httpProvider) {
//
//    $routeProvider.
//        when('/', {templateUrl: '/assets/home.html',   controller: HomeCtrl}).
//        otherwise({redirectTo: '/'});
//
//    //$httpProvider.defaults.headers.
//      //  common['X-CSRF-Token'] = $['meta[name=csrf-token]'].attr('content');
//});

function ErrorCtrl($scope) {

    $scope.message = "We can't seem to find what you are looking for (404)";


}
