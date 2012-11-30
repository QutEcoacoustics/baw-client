

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

    bawss.factory('PersonaAuthenticator', function() {
        navigator.id.watch({
            // TODO: quite obviously optionally wrong
            loggedInUser: null,
            onlogin: function(assertion) {
                // A user has logged in! Here you need to:
                // 1. Send the assertion to your backend for verification and to create a session.
                // 2. Update your UI.
                $.ajax({ /* <-- This example uses jQuery, but you can use whatever you'd like */
                    type: 'POST',
                    url: '/security/auth/browser_id/callback', // This is a URL on your website.
                    data: {assertion: assertion},
                    success: function(res, status, xhr) { window.location.reload(); },
                    error: function(xhr, status, err) { console.error("Login failure: " + err); }
                });
            },
            onlogout: function() {
                // A user has logged out! Here you need to:
                // Tear down the user's session by redirecting the user or making a call to your backend.
                // Also, make sure loggedInUser will get set to null on the next page load.
                // (That's a literal JavaScript null. Not false, 0, or undefined. null.)
                $.ajax({
                    type: 'POST',
                    url: '/security/auth/browser_id/callback', // This is a URL on your website.
                    success: function(res, status, xhr) { window.location.reload(); },
                    error: function(xhr, status, err) { console.error("Logout failure: " + err); }
                });
            }
        });


        return {
            login:    function login() { navigator.id.request(); },
            logout: function logout() { navigator.id.logout(); }
        }
    });





})();