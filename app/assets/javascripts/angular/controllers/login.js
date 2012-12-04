function LoginCtrl($scope, $http, authService, PersonaAuthenticator) {


    $scope.submit = function (provider) {

        switch (provider) {
            case "persona":
                PersonaAuthenticator.login();
                break;
            default:
                throw "Provider not matched";
        }

//        console.info(result);

        //$http.post(path).success(function () {
        //    authService.loginConfirmed();
        //});
    }
}
LoginCtrl.$inject = ['$scope', '$http', 'authService', 'PersonaAuthenticator'];
