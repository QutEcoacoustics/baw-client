angular.module('bawApp.users', [])

    .controller('UsersCtrl', ['$scope', '$location', '$resource', '$routeParams',  'User',


        function UsersCtrl($scope, $location, $resource, $routeParams, User) {

            var self = this;
            var userResource = User;
            var routeArgs = {userId: $routeParams.userId};

            $scope.user = userResource.get(routeArgs, function () {
                $scope.original = angular.copy($scope.user);
            });

            $scope.lastModifiedDisplay = moment($scope.user.updatedAt).calendar();
        }

    ])

    .controller('UserCtrl', ['$scope', '$resource', '$routeParams', 'User',


        function UsersCtrl($scope, $resource, $routeParams, User) {
            $scope.usersResource = $resource('/users', {});
            $scope.users = $scope.usersResource.query();
        }

    ]);


