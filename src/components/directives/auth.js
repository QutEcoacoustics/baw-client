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

                var isLoginBoxOpen = function(){
                    var loginHolderElm = $('#login-holder');
                    var mainElm = $('#content');

                    var doCheck = {
                        loginIsVisible: loginHolderElm.is(':visible'),
                        loginIsHidden: loginHolderElm.is(':hidden'),
                        mainIsVisible: mainElm.is(':visible'),
                        mainIsHidden: mainElm.is(':hidden')
                    };

                    var loginVisible = doCheck.loginIsVisible && !doCheck.loginIsHidden;
                    //var mainVisible = doCheck.mainIsVisible && !doCheck.mainIsHidden;
                    //var isAnimating = loginHolderElm.is(':animated');

                    return loginVisible;
                }

                scope.$on('event:auth-loginRequired', function () {
                    // TODO: add extra checks to stop multiple animations

                    var isOpen = isLoginBoxOpen();

                    if(!isOpen){
                        console.warn("showing login window");
                        login.slideDown('slow', function () {

                            main.hide();
                        });
                    }
                });

                scope.$on('event:auth-loginConfirmed', function () {

                    var isOpen = isLoginBoxOpen();
                    if(isOpen){
                        console.warn("hiding login window");
                        main.show();
                        login.slideUp();
                    }
                });

                scope.$on('event:auth-loginCancelled', function () {

                    var isOpen = isLoginBoxOpen();
                    if(isOpen){
                        console.warn("hiding login window");
                        main.show();
                        login.slideUp();
                    }
                });
            }
        }
    })

;



