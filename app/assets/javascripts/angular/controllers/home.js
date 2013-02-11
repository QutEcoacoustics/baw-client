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

function HomeCtrl($scope, $resource, $routeParams, AudioEvent) {

    $scope.welcomeMessage = "Welcome to <bar>";

    $scope.downloadAnnotationLink = AudioEvent.csvLink();


}

HomeCtrl.$inject = ['$scope', '$resource', '$routeParams', 'AudioEvent'];