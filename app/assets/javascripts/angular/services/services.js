

(function() {
    /**
     * Helper method for adding a put request onto the standard angular resource service
     * @param $resource - the stub resource
     * @param {string} path - the webserver path
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
        return resourcePut($resource, '/audio_events', actions);
    });


})();