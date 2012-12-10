

(function() {
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
        a.update = a.update || {method: 'PUT'};
        return $resource(path, paramDefaults, a);
    }

    var bawss = angular.module("baw.services", ['ngResource']);


    /**
     *
     */
    bawss.factory('Project', function($resource) {
        return resourcePut($resource, '/projects/:projectId', {projectId: "@projectId"});
    });

    bawss.factory('AudioRecording', function($resource) {
        return resourcePut($resource, '/audio_recordings/:recordingId', {recordingId: '@recordingId'});
    });

    bawss.factory('AudioEvent', function($resource) {
        var actions = {
            query: { method:'GET', isArray: true }
        };

        var resource = resourcePut($resource, '/audio_events/:audioEventId', {audioEventId: '@audioEventId'}, actions);
        resource.csvLink = "/audio_events/download.csv";
        return resource;
    });

    bawss.factory('Tag', function($resource) {
        return $resource('/tags/:tagId', {tagId: '@tagId'}, {});
    });

    // authentication
    bawss.factory('Authenticator', ['$rootScope', 'authService', '$http', function($rootScope, authService, $http){
        return {
            loginSuccess: function loginSuccess(data, status, headers, config) {
                // a provider has just logged in
                // the response arg, is the response from our server (devise)
                // extract auth_token and set in rootScope

                if (!data || data.response !== "ok") {
                    throw "Authenticator.loginSuccess: this function should not be called unless a successful response was received"
                }

                $rootScope.$safeApply($rootScope, function() {
                    $rootScope.authorisationToken = data.auth_token;
                    $rootScope.userData = data;
                    $http.defaults.headers.common["Authorization"] = 'Token token="' + $rootScope.authorisationToken + '"';

                    console.log("Login successful", data);

                    authService.loginConfirmed();
                });
            },
            loginFailure:function loginFailure(data, status, headers, config) {
                $rootScope.$safeApply($rootScope, function() {
                    $rootScope.authorisationToken = null;
                    $rootScope.userData = null;
                    $http.defaults.headers.common["Authorization"] = null;
                    console.error("Login failure: ", data, status, headers, config);
                });
            },
            logoutSuccess:function logoutSuccess(data, status, headers, config) {
                $rootScope.$safeApply($rootScope, function() {
                    $rootScope.authorisationToken = null;
                    $rootScope.userData = null;
                    $http.defaults.headers.common["Authorization"] = null;

                    console.log("Logout successful", data);
                });
            },
            logoutFailure:function logoutFailure(data, status, headers, config) {
                console.error("Logout failure: ", data, status, headers, config);
            }
        }
    }]);

    bawss.factory('AuthenticationProviders', ['$rootScope', 'authService', '$http', 'Authenticator', function($rootScope, authService, $http, Authenticator) {
        var signOutPath = '/security/sign_out';
        function signOut() {
            $http({method:'GET', url:signOutPath})
                .success(Authenticator.logoutSuccess)
                .error(Authenticator.logoutFailure);
        }

        // Navigator is the persona global object
        navigator.id.watch({
            loggedInUser: null,
            onlogin: function(assertion) {
                // A user has logged in! Here you need to:
                // 1. Send the assertion to your backend for verification and to create a session.
                // 2. Update your UI.
                $http({method:'POST', url:'/security/auth/browser_id/callback', data:{assertion: assertion}})
                    .success(Authenticator.loginSuccess)
                    .error(Authenticator.loginFailure);

            },
            // A user has logged out! Here you need to:
            // Tear down the user's session by redirecting the user or making a call to your backend.
            // Also, make sure loggedInUser will get set to null on the next page load.
            onlogout: signOut
        });

        function openIdLogin(url) {
            var popPath = "/security/auth/open_id?openid_url=" + angularCopies.fixedEncodeURIComponent(url);
            popUpWindow(popPath, 700, 500, function(data) {
                if (data.response === "ok") {
                    Authenticator.loginSuccess(data);
                }
                else {
                    Authenticator.loginFailure(data);
                }
            });
        }

        return {
            "persona" : {
                login:  function login() { navigator.id.request(); },
                logout: function logout() { navigator.id.logout(); },
                requires: null
            },
            "google" : {
                login:  function() {
                    openIdLogin('https://www.google.com/accounts/o8/id');
                },
                logout: signOut,
                requires: null
            },
            "yahoo" : {
                login:  function() {
                    openIdLogin('https://me.yahoo.com');
                },
                logout: signOut,
                requires: null
            },
            "open_id" : {
                login:  openIdLogin,
                logout: signOut,
                requires: {
                    text: "Enter your OpenID URL",
                    type: "url"
                }
            }
        }
    }]);




})();