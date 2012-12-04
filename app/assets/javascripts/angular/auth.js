angular.module('angular-auth', ['http-auth-interceptor', 'content-mocks'])
/**
 * This directive will find itself inside HTML as a class,
 * and will remove that class, so CSS will remove loading image and show app content.
 * It is also responsible for showing/hiding login form.
 */
    .directive('authDemoApplication', function () {
        return {
            restrict: 'C',
            link: function (scope, elem, attrs) {
                //once Angular is started, remove class:
                elem.removeClass('waiting-for-angular');

                var login = elem.find('#login-holder');
                var main = elem.find('#content');

                login.hide();

                scope.$on('event:auth-loginRequired', function () {
                    login.slideDown('slow', function () {
                        main.hide();
                    });
                });
                scope.$on('event:auth-loginConfirmed', function () {
                    main.show();
                    login.slideUp();
                });
            }
        }
    });



function LoginCtrl($scope, $http, authService, PersonaAuthenticator) {


    $scope.submit = function (provider) {

        switch (provider) {
            case "persona":
                PersonaAuthenticator.login();
                break;
            case "google":
                login('/security/auth/google_oauth2', 800,600);
                break;
            default:
                throw "Provider not matched";
        }

        //console.info(result);

        //$http.post(path).success(function () {
        //    authService.loginConfirmed();
        //});
    }
}
LoginCtrl.$inject = ['$scope', '$http', 'authService', 'PersonaAuthenticator'];
