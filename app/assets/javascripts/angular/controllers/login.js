function LoginCtrl($scope, $http, $location, authService, AuthenticationProviders, Authenticator) {

    // WARNING: Cookies required for this to work
    function checkLogin() {
        Authenticator.checkLogin();
    }

    checkLogin();

    $scope.submit = function (provider) {

       var authProvider = AuthenticationProviders[provider];

        if (!authProvider) {
            console.error('Unknown provider',authProvider, provider);
            throw "LoginCtrl:submit: Unknown Provider!";
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

    $scope.requireMoreInformation = null;
    $scope.additionalInformation = null;
    $scope.login = function() {
        $scope.$emit('event:auth-loginRequired');
    };

    $scope.logout = function() {

        var provider, actualProvider;
        try {
            provider = $scope.$root.userData.providerId;
        }
        catch(e){
            console.error('Error getting provider id', e);
        }

        if (provider) {
            actualProvider = AuthenticationProviders[provider];
            if (actualProvider) {
                actualProvider.logout();
                //$reloadView();
            }
        }
    };

    $scope.cancelLogin = function(){
        $location.path('/');
        $scope.$emit('event:auth-loginCancelled');
    };

    $scope.displayName = "";
    $scope.email = "";

    $scope.$watch('$root.loggedIn', function (){
        if ($scope.loggedIn) {
            $scope.displayName = $scope.userData.friendlyName;
            $scope.email = $scope.userData.email;
        }
        else{
            $scope.userName = "";
            $scope.email = "";
        }
    });

}

LoginCtrl.$inject = ['$scope', '$http', '$location', 'authService', 'AuthenticationProviders', 'Authenticator'];
