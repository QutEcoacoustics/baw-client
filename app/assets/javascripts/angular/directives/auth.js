angular.module('angular-auth', ['http-auth-interceptor'])
/**
 * This directive will find itself inside HTML as a class,
 * and will remove that class, so CSS will remove loading image and show app content.
 * It is also responsible for showing/hiding login form.
 */
    .directive('bawAuth', function () {
        return {
            restrict: 'AC',
            link: function (scope, elem, attrs) {
                //once Angular is started, remove class:
                elem.removeClass('waiting-for-angular');

                var login = elem.find('#login-holder');
                var main = elem.find('#content');

                login.hide();

                scope.$on('event:auth-loginRequired', function () {
                    // TODO: add extra checks to stop multiple animations
                    var loginIsVisible = $('#login-holder').is(':visible');
                    var loginIsHidden = $('#login-holder').is(':hidden');
                    var mainIsVisible = $('#content').is(':visible');
                    var mainIsHidden = $('#content').is(':hidden');

                    if(loginIsVisible || !loginIsHidden || !mainIsVisible || mainIsHidden || login.is(':animated')){
                        // noop - do nothing, since login is already shown
                    }else {
                        console.warn("sliding login window down");
                        login.slideDown('slow', function () {

                            main.hide();
                        });
                    }
                });

                scope.$on('event:auth-loginConfirmed', function () {
                    console.warn("sliding login window up");
                    main.show();
                    login.slideUp();
                });

                scope.$on('event:auth-loginCancelled', function () {
                    console.warn("sliding login window up");
                    main.show();
                    login.slideUp();
                });
            }
        }
    })

;



