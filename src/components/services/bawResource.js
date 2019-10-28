angular
    .module("bawApp.services.resource", ["ngResource"])
    .factory(
    "bawResource",
    [
        "$resource", "conf.paths",
        function ($resource, paths) {

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
             * return the filterUrl, allowing for cross-site access of audioEvents in other deployments
             * @param service string a key in paths.api.routes e.g. 'audioEvent'
             * @param endpoint string a key in paths.api.routes[service]
             * @param domain if provided will prepend to the relative url, otherwise will use absolute
             * Note:
             */
            function crossDomainUrlAbsolute(service, endpoint, host = null) {

                if (host) {
                    return host.replace(/\/$/,"") + paths.api.routes[service][endpoint];
                } else {
                    return paths.api.routes[service][endpoint + "Absolute"];
                }

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
                var convertedPath = uriConvert(path);

                var a = actions || {};
                a.update = a.update || {method: "PUT"};
                a.query = a.query || {method: "GET", isArray: false};
                var resource = $resource(convertedPath, paramDefaults, a);

                resource.modifiedPath = convertedPath;

                return resource;
            };

            bawResource.uriConvert = uriConvert;
            bawResource.crossDomainUrlAbsolute = crossDomainUrlAbsolute;
            return bawResource;
        }
    ]
);