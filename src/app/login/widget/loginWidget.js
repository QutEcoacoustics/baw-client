angular.module("bawApp.login.loginWidget", [])
    .directive(
    "loginWidget",
    [
        "conf.paths",
        function(paths) {

            // directive definition object
            return {
                templateUrl: paths.site.files.login.loginWidget,
                controller: [
                    "$scope",
                    "$element",
                    "$attrs",
                    "conf.paths",
                    "UserProfile",
                    function($scope, $element, $attrs, paths, UserProfile) {
                        $scope.profile = {};

                        UserProfile.get.then(() => {
                            $scope.profile = UserProfile.profile;
                        });

                        $scope.defaultUserImage = paths.site.files.login.defaultImageAbsolute;
                        $scope.logoutLink = paths.api.links.logoutAbsolute;
                        $scope.loginLink = paths.api.links.loginActualAbsolute;
                        $scope.registerLink = paths.api.links.registerAbsolute;
                        $scope.adminLink = paths.api.links.adminAbsolute;
                    }]
            };
        }
    ]
);