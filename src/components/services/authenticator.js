angular
    .module("bawApp.services.authenticator", [])
    .factory(
    "Authenticator",
    [
        "$rootScope", "authService", "$http", "conf.paths",
        function ($rootScope, authService, $http, paths) {
            const authHeader = "Authorization";

            // As soon as the module is initiated...
            // WARNING: Cookies required for this to work
            checkLogin();

            var that = {
                loginSuccess: loginSuccess,
                loginFailure: loginFailure,
                logoutSuccess: function logoutSuccess(data, status, headers, config) {
                    $rootScope.$safeApply($rootScope, function () {
                        that.authToken = null;
                        $rootScope.userData = null;
                        $http.defaults.headers.common[authHeader] = null;

                        console.log("Logout successful", data);
                    });
                },
                logoutFailure: function logoutFailure(data, status, headers, config) {
                    console.error("Logout failure: ", data, status, headers, config);
                },
                checkLogin: checkLogin,
                authToken: null
            };

            return that;

            // functions

            function loginSuccess(data, status, headers, config) {
                // a provider has just logged in
                // the response arg, is the response from our server (devise)
                // extract auth_token and set in rootScope

                if (!data) {
                    throw "Authenticator.loginSuccess: this function should not be called unless a successful response was received";
                }

                if (data.authToken === undefined) {
                    throw "The authorisation token can not be undefined at this point";
                }

                that.authToken = data.authToken;
                $http.defaults.headers.common[authHeader] = "Token token=\"" +
                                                                 that.authToken +
                                                                 "\"";

                $rootScope.$safeApply($rootScope, function () {
                    $rootScope.userData = data;
                    console.log("Login successful", data);
                    authService.loginConfirmed();
                });
            }

            function loginFailure(data, status, headers, config) {
                $rootScope.$safeApply($rootScope, function () {
                    that.authToken = null;
                    $rootScope.userData = null;
                    $http.defaults.headers.common[authHeader] = null;

                    if (config && config.url === paths.api.routes.security.pingAbsolute) {
                        return;
                    }

                    if (status === 401) {
                        console.warn("Login failure, authentication has failed with the provider. ",
                                     data, status,
                                     headers, config);
                    }
                    else {
                        console.error("Login failure: ", data, status, headers, config);
                    }
                });
            }


            /**
             * Checks whether a user is logged in or not. Note: this is the only method
             * in our site which relies on cookies!
             */
            function checkLogin() {
                if ($rootScope.loggedIn !== true) {
                    if ($rootScope.logInPending) {
                        return false;
                    }

                    $rootScope.logInPending = true;

                    $http.get(paths.api.routes.security.pingAbsolute,
                              {params: {antiCache: (new Date()).getTime()}, cache: false})
                        .success(checkLoginSuccess)
                        .error(checkLoginFailure)
                        .finally(function() {
                            $rootScope.logInPending = false;
                        });
                }

                return true;
            }

            function checkLoginSuccess(wrappedData, status, headers, config) {
                // the ping request is different - it only requests data
                var data = wrappedData.data;

                if (wrappedData.meta.error) {
                    console.warn("Logged in via ping failed (probably something wrong with cookies or not logged in).");
                    loginFailure(wrappedData, status, headers, config);
                } else {
                    console.info("Logged in via ping (probably used cookies).");
                    loginSuccess(data, status, headers, config);
                }

            }

            function checkLoginFailure(data, status, headers, config) {
                console.error(
                    "Ping login service failure - this should not happen",
                    data,
                    status,
                    headers,
                    config
                );
            }
        }])
    .factory(
    "AuthenticationProviders",
    [
        "$rootScope", "authService", "$http", "Authenticator", "$q", "$url",
        function ($rootScope, authService, $http, Authenticator, $q, $url) {
            var signOutPath = "/security/sign_out";

            function signOut() {
                $http({method: "GET", url: signOutPath})
                    .success(Authenticator.logoutSuccess)
                    .error(Authenticator.logoutFailure);
            }

            // Navigator is the persona global object
            if (navigator) {
                if (navigator.id) {
                    navigator.id.watch({
                                           loggedInUser: null,
                                           onlogin: function (assertion) {
                                               // A user has logged in! Here you need to:
                                               // 1. Send the assertion to your backend for verification and to create a session.
                                               // 2. Update your UI.
                                               $http({
                                                         method: "POST",
                                                         url: "/security/auth/browser_id/callback",
                                                         data: {assertion: assertion}
                                                     })
                                                   .success(Authenticator.loginSuccess)
                                                   .error(Authenticator.loginFailure);

                                           },
                                           // A user has logged out! Here you need to:
                                           // Tear down the user's session by redirecting the user or making a call to your backend.
                                           // Also, make sure loggedInUser will get set to null on the next page load.
                                           onlogout: signOut
                                       });
                }
            }
            else {
                console.error("Unable to start Persona authentication binding. This is usually caused by a lack of internet.");
            }

            function openIdLogin(url) {
                var popPath = "/security/auth/open_id?openid_url=" +
                              $url.fixedEncodeURIComponent(url);
                baw.popUpWindow(popPath, 700, 500, function (data) {
                    data = data || {};

                    throw "add object camel casing here";
                    /*railsFieldRenamingInterceptor().core(data);

                     if (data.response === "ok") {
                     Authenticator.loginSuccess(data);
                     }
                     else {
                     Authenticator.loginFailure(data);
                     }*/
                });
            }

            function openAuthLogin(providerId) {
                var popPath = "/security/auth/" + providerId;
                baw.popUpWindow(popPath, 700, 500, function (data) {
                    data = data || {};

                    throw "add object camel casing here";
                    /*railsFieldRenamingInterceptor().core(data);

                     if (data.response === "ok") {
                     Authenticator.loginSuccess(data);
                     }
                     else {
                     Authenticator.loginFailure(data);
                     }*/
                });
            }

            return {
                "persona": {
                    login: function login() {
                        navigator.id.request();
                    },
                    logout: function logout() {
                        navigator.id.logout();
                    },
                    requires: null
                },
                "google": {
                    login: function () {
                        openIdLogin("https://www.google.com/accounts/o8/id");
                    },
                    logout: signOut,
                    requires: null
                },
                "yahoo": {
                    login: function () {
                        openIdLogin("https://me.yahoo.com");
                    },
                    logout: signOut,
                    requires: null
                },
                "open_id": {
                    login: openIdLogin,
                    logout: signOut,
                    requires: {
                        text: "Enter your OpenID URL:",
                        type: "url"
                    }
                },
                "facebook": {
                    login: function () {
                        openAuthLogin("facebook");
                    },
                    logout: signOut,
                    requires: null
                },
                "github": {
                    login: function () {
                        openAuthLogin("github");
                    },
                    logout: signOut,
                    requires: null
                },
                "twitter": {
                    login: function () {
                        openAuthLogin("twitter");
                    },
                    logout: signOut,
                    requires: null
                },
                "windowslive": {
                    login: function () {
                        openAuthLogin("windowslive");
                    },
                    logout: signOut,
                    requires: null
                }
            };
        }
    ]
);