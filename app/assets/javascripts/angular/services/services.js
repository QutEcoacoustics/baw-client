(function () {
    /**
     * Helper method for adding a put request onto the standard angular resource service
     * @param $resource - the stub resource
     * @param {string} path - the web server path
     * @param {Object} paramDefaults
     * @param {Object} [actions] a set of actions to also add (extend)
     * @return {*}
     */
    function resourcePut($resource, path, paramDefaults, actions) {
        var a = actions || {};
        a.update = a.update || { method: 'PUT' };
        return $resource(path, paramDefaults, a);
    }

    var bawss = angular.module("baw.services", ['ngResource']);


    /**
     *
     */
    bawss.factory('Project', function ($resource) {
        return resourcePut($resource, '/projects/:projectId', {projectId: "@projectId"});
    });

    bawss.factory('Site', function ($resource) {
        return resourcePut($resource, '/sites/:siteId', {siteId: "@siteId"});
    });

    bawss.factory('AudioRecording', function ($resource) {
        return resourcePut($resource, '/audio_recordings/:recordingId', {recordingId: '@recordingId'});
    });

    bawss.factory('AudioEvent', function ($resource) {
        var actions = {
            query: { method: 'GET', isArray: true }
        };

        var resource = resourcePut($resource, '/audio_events/:audioEventId', {audioEventId: '@audioEventId'}, actions);
        resource.csvLink = "/audio_events/download.csv";
        return resource;
    });

    bawss.factory('Tag', function ($resource) {
        return $resource('/tags/:tagId', {tagId: '@tagId'}, {});
    });

    bawss.factory('Media', function ($resource) {
        var mediaResource = $resource('/media/:recordingId', {recordingId: '@recordingId'});

        // this is a read only service, remove unnecessary methods
        delete  mediaResource.save;
        delete  mediaResource.remove;
        delete  mediaResource.delete;
        //delete  mediaResource.update;

        return mediaResource;
    });

    // authentication
    bawss.factory('Authenticator', ['$rootScope', 'authService', '$http', function ($rootScope, authService, $http) {
        function loginSuccess(data, status, headers, config) {
            // a provider has just logged in
            // the response arg, is the response from our server (devise)
            // extract auth_token and set in rootScope

            if (!data || data.response !== "ok") {
                throw "Authenticator.loginSuccess: this function should not be called unless a successful response was received"
            }

            $rootScope.$safeApply($rootScope, function () {
                $rootScope.authorisationToken = data.authToken;
                $rootScope.userData = data;

                if($rootScope.authorisationToken === undefined) {
                    throw "The authorisation token can not be undefined at this point";
                }

                $http.defaults.headers.common["Authorization"] = 'Token token="' + $rootScope.authorisationToken + '"';

                console.log("Login successful", data);

                authService.loginConfirmed();
            });
        }

        function loginFailure(data, status, headers, config) {
            $rootScope.$safeApply($rootScope, function () {
                $rootScope.authorisationToken = null;
                $rootScope.userData = null;
                $http.defaults.headers.common["Authorization"] = null;

                if (config.url === "/security/ping") {
                    return;
                }

                if (status === 401){
                    console.warn("Login failure, authentication has failed with the provider. ", data, status, headers, config);
                }
                else {
                    console.error("Login failure: ", data, status, headers, config);
                }
            });
        }

        return {
            loginSuccess: loginSuccess,
            loginFailure: loginFailure,
            logoutSuccess: function logoutSuccess(data, status, headers, config) {
                $rootScope.$safeApply($rootScope, function () {
                    $rootScope.authorisationToken = null;
                    $rootScope.userData = null;
                    $http.defaults.headers.common["Authorization"] = null;

                    console.log("Logout successful", data);
                });
            },
            logoutFailure: function logoutFailure(data, status, headers, config) {
                console.error("Logout failure: ", data, status, headers, config);
            },
            /**
             * Checks whether a user is logged in or not. Note: this is the only method
             * in our site which relies on cookies!
             * @return {boolean}
             */
            checkLogin: function checkLogin() {
                if ($rootScope.loggedIn !== true) {
                    $http.get('/security/ping', {params: {antiCache: (new Date()).getTime()}, cache: false })
                        .success(function checkLoginSuccess(data, status, headers, config) {
                            // the ping request is different, because it just asks for information, it will always return a 200,
                            // so split on response field
                            if (data && data.response == "ok") {
                                console.info("Logged in via ping (probably used cookies).");
                                loginSuccess(data, status, headers, config);
                            }
                            else {
                                console.info("Logged in via ping failed (probably something wrong with cookies).");
                                loginFailure(data, status, headers, config);
                            }

                        })
                        .error(function checkLoginFailure(data, status, headers, config) {
                            console.error("Ping login service failure - this should not happen", data, status, headers, config);
                        })
                    ;
                }

                return true;
            }
        }
    }]);

    bawss.factory('AuthenticationProviders', ['$rootScope', 'authService', '$http', 'Authenticator', 'railsFieldRenamingInterceptor', '$q', function ($rootScope, authService, $http, Authenticator, railsFieldRenamingInterceptor, $q) {
        var signOutPath = '/security/sign_out';

        function signOut() {
            $http({method: 'GET', url: signOutPath})
                .success(Authenticator.logoutSuccess)
                .error(Authenticator.logoutFailure);
        }

        // Navigator is the persona global object
        if (navigator) {
            navigator.id.watch({
                loggedInUser: null,
                onlogin: function (assertion) {
                    // A user has logged in! Here you need to:
                    // 1. Send the assertion to your backend for verification and to create a session.
                    // 2. Update your UI.
                    $http({method: 'POST', url: '/security/auth/browser_id/callback', data: {assertion: assertion}})
                        .success(Authenticator.loginSuccess)
                        .error(Authenticator.loginFailure);

                },
                // A user has logged out! Here you need to:
                // Tear down the user's session by redirecting the user or making a call to your backend.
                // Also, make sure loggedInUser will get set to null on the next page load.
                onlogout: signOut
            });
        }
        else {
            console.error("Unable to start Persona authentication binding. This is usually caused by a lack of internet.")
        }

        function openIdLogin(url) {
            var popPath = "/security/auth/open_id?openid_url=" + angularCopies.fixedEncodeURIComponent(url);
            popUpWindow(popPath, 700, 500, function (data) {
                data = data || {};

                railsFieldRenamingInterceptor().core(data);

                if (data.response === "ok") {
                    Authenticator.loginSuccess(data);
                }
                else {
                    Authenticator.loginFailure(data);
                }
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
                    openIdLogin('https://www.google.com/accounts/o8/id');
                },
                logout: signOut,
                requires: null
            },
            "yahoo": {
                login: function () {
                    openIdLogin('https://me.yahoo.com');
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
            }
        }
    }]);


})();