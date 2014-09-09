angular.module("bawApp.services.resource", ["ngResource"])
    .factory("bawResource", ["$resource", function ($resource) {

        /**
         *
         * @param uri
         * @returns {*}
         */
        function uriConvert(uri) {
            // find all place holders in this form: '{identifier}'
            // replace with placeholder in this form: ':identifier'
            return uri.replace(/(\{([^{}]*)\})/g, ":$2");
        }

        /**
         * @name bawResource
         * Helper method for adding a put request onto the standard angular resource service
         * @param {string} path - the web server path
         * @param {Object} paramDefaults - the default parameters
         * @param {Object} [actions] - a set of actions to also add (extend)
         * @return {*}
         */
        var bawResource = function resourcePut(path, paramDefaults, actions) {
            path = uriConvert(path);

            var a = actions || {};
            a.update = a.update || { method: 'PUT' };
            var resource = $resource(path, paramDefaults, a);

            resource.modifiedPath = path;

            return  resource;
        };

        return bawResource;
    }]);