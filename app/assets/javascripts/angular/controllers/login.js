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

    $scope.login = function() {
        $scope.$emit('event:auth-loginRequired');
    };

    $scope.logout = function() {

        var p, ap;
        try {
            p = $scope.$root.userData.provider_id;
        }
        catch(e){}

        if (p) {
            ap = AuthenticationProviders[p];
            if (ap) {
                ap.logout();
            }
        }
    };

    $scope.loggedIn = false;
    $scope.displayName = "";
    $scope.email = "";

    $scope.$watch('$root.userData', function (){
        var token = $scope.$root.authorisationToken,
            userData = $scope.$root.userData;
        $scope.loggedIn = (token && userData) ? true : false;
        if ($scope.loggedIn) {
            $scope.displayName = userData.friendly_name;
            $scope.email = userData.email;
        }
        else{
            $scope.userName = "";
            $scope.email = "";
        }
    });

}

LoginCtrl.$inject = ['$scope', '$http', 'authService', 'AuthenticationProviders'];
