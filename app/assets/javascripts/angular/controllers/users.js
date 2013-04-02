"use strict";


;
(function (undefined) {
    var app = angular.module('bawApp.controllers');

    app.controller('ListenCtrl', ['$scope', '$location', '$resource', '$routeParams',  'User',


        function UserCtrl($scope, $location, $resource, $routeParams, User) {

            var self = this;
            var userResource = User;
            var routeArgs = {userId: $routeParams.userId};

            $scope.user = userResource.get(routeArgs, function () {
                $scope.original = angular.copy($scope.user);
            });

            $scope.lastModifiedDisplay = moment($scope.user.updatedAt).calendar();
        }

    ]);

    app.controller('ListenCtrl', ['$scope', '$location', '$resource', '$routeParams',  'User',


        function UserCtrl($scope, $location, $resource, $routeParams, User) {

            var self = this;
            var userResource = User;
            var routeArgs = {userId: $routeParams.userId};

            $scope.user = userResource.get(routeArgs, function () {
                $scope.original = angular.copy($scope.user);
            });

            $scope.lastModifiedDisplay = moment($scope.user.updatedAt).calendar();
        }

    ]);

})();



function UsersCtrl($scope, $resource, $routeParams, User) {
    $scope.usersResource = $resource('/users', {});
    $scope.users = $scope.usersResource.query();
}

UsersCtrl.$inject = ['$scope', '$resource', '$routeParams', 'User'];




