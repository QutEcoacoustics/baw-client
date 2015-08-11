angular.module("bawApp.login", [])

    .controller("LoginCtrl",
        ["$scope", "$http", "$location", "authService", "AuthenticationProviders", "Authenticator",
            function LoginCtrl($scope, $http, $location, authService, AuthenticationProviders, Authenticator) {

                $scope.submit = function (provider) {

                    var authProvider = AuthenticationProviders[provider];

                    if (!authProvider) {
                        console.error("Unknown provider", authProvider, provider);
                        throw "LoginCtrl:submit: Unknown Provider!";
                    }

                    if (authProvider.requires) {

                        if (!$scope.additionalInformation || $scope.additionalInformation === "" /*  && validation check */) {
                            $scope.requireMoreInformation = authProvider.requires;
                            $scope.requireMoreInformation.providerId = provider;
                            return;
                        }

                        authProvider.login($scope.additionalInformation);

                        $scope.requireMoreInformation = null;
                        $scope.additionalInformation = undefined;
                    }
                    else {
                        $scope.requireMoreInformation = null;

                        authProvider.login();
                    }
                };

                $scope.requireMoreInformation = null;
                $scope.additionalInformation = null;
                $scope.login = function () {
                    $scope.$emit("event:auth-loginRequired");
                };

                $scope.logout = function () {

                    var provider, actualProvider;
                    try {
                        /**** BROKEN *88888******/
                        provider = $scope.$root.userData.providerId;
                    }
                    catch (e) {
                        console.error("Error getting provider id", e);
                    }

                    if (provider) {
                        actualProvider = AuthenticationProviders[provider];
                        if (actualProvider) {
                            actualProvider.logout();
                            //$reloadView();
                        }
                    }
                };

                $scope.cancelLogin = function () {
                    $location.path("/");
                    $scope.$emit("event:auth-loginCancelled");
                };





            }
        ]);

