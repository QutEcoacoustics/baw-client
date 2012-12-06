function LoginCtrl($scope, $http, authService, AuthenticationProviders) {

    $scope.requireMoreInformation = null;
    $scope.additionalInformation = null;


    $scope.submit = function (provider) {

       var authProvider = AuthenticationProviders[provider];

        if (!authProvider) {
            throw "LoginCtrl:submit: Unknown Provider!"
        }

        if (authProvider.requires) {

            if (!$scope.additionalInformation || $scope.additionalInformation == "" /*  && validation check */) {
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

    $scope.logout = function() {

    }
}

LoginCtrl.$inject = ['$scope', '$http', 'authService', 'AuthenticationProviders'];
