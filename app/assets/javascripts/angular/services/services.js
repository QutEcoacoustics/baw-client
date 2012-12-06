

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

                $rootScope.authorisationToken = data.auth_token;
                $http.defaults.headers.common["Authorization"] = 'Token token="' +$rootScope.authorisationToken + '"';

                console.log("login successful", data);

                authService.loginConfirmed();
            },
            loginFailure:function loginFailure(data, status, headers, config) {
                $http.defaults.headers.common = null;
                console.error("Login failure: ", data, status, headers, config);
            },
            logoutSuccess:function logoutSuccess(data, status, headers, config) {

                $http.defaults.headers.common = null;
                $rootScope.authorisationToken = null;

                console.log("login successful", data);
            },
            logoutFailure:function logoutFailure(data, status, headers, config) {
                console.error("Login failure: ", data, status, headers, config);
            }
        }
    }]);

    bawss.factory('PersonaAuthenticator', ['$rootScope', 'authService', '$http', 'Authenticator', function($rootScope, authService, $http, Authenticator) {
        // Navigator is the persona global object
        navigator.id.watch({
            onlogin: function(assertion) {
                // A user has logged in! Here you need to:
                // 1. Send the assertion to your backend for verification and to create a session.
                // 2. Update your UI.
                $http({method:'POST', url:'/security/auth/browser_id/callback', data:{assertion: assertion}})
                    .success(Authenticator.loginSuccess)
                    .error(Authenticator.loginFailure);

            },
            onlogout: function() {
                // A user has logged out! Here you need to:
                // Tear down the user's session by redirecting the user or making a call to your backend.
                // Also, make sure loggedInUser will get set to null on the next page load.
                $http({method:'GET', url:'/security/sign_out'})
                    .success(Authenticator.logoutSuccess)
                    .error(Authenticator.logoutFailure);
            }
        });

        return {
            login:  function login() { navigator.id.request(); },
            logout: function logout() { navigator.id.logout(); }
        }
    }]);


    bawss.factory('GoogleAuthenticator', function() {
        return {

        }
    });


})();