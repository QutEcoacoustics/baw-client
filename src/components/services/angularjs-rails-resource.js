// Adapted from https://github.com/tpodom/angularjs-rails-resource/blob/master/vendor/assets/javascripts/angularjs/rails/resource.js

// Copyright (c) 2012 Tommy Odom
//
// MIT License
// https://github.com/tpodom/angularjs-rails-resource

(function (undefined) {


    function transformObject(data, transform) {
        var newKey;

        if (data && angular.isObject(data)) {
            angular.forEach(data, function (value, key) {
                newKey = transform(key);

                if (newKey !== key) {
                    data[newKey] = value;
                    delete data[key];
                }

                transformObject(value, transform);
            });
        }
    }

    var STAMPER_LABEL = "__railsJsonRenamer__";

    function stampObject(object, value) {
        if (angular.isObject(object)) {
            try {
                // mark this object as having been transformed

                Object.defineProperty(object, STAMPER_LABEL, {configurable: true, value: value});
            }
            catch (e) {
                console.warn("Object.defineProperty failed in stampObject");
            }
            return object;
        }
        else {
            return object;
        }
    }

    function isStamped(object) {
        if (object) {
            return object.hasOwnProperty(STAMPER_LABEL);
        }
        else {
            return false;
        }
    }

    function camelize(key) {
        if (!angular.isString(key)) {
            return key;
        }

        // should this match more than word and digit characters?
        return key.replace(/_[\w\d]/g, function (match, index, string) {
            return index === 0 ? match : string.charAt(index + 1).toUpperCase();
        });
    }

    function underscore(key) {
        if (!angular.isString(key)) {
            return key;
        }

        return key.replace(/[A-Z]/g, function (match, index) {
            return index === 0 ? match : '_' + match.toLowerCase();
        });
    }

    angular.module('rails', [])
        .factory('railsFieldRenamingTransformer', function () {

            return function railsFieldRenamingTransformer(data, headers) {
                // TODO: add conditions
                // probs only want to do this if headers contains app/json
                // and only if object has a __railsJsonRenamer__
                // or if request is going to our server?

                if ((headers()["Accept"] || "").indexOf("application/json") >= 0) {

                    if (data === undefined || data === null) {
                        return;
                    }

                    if (!angular.isObject(data)) {
                        return data;
                    }

                    transformObject(data, underscore);

                    stampObject(data, "camelCased->underscore");

                }

                return data;
            };
        })

        .factory('railsFieldRenamingInterceptor', function () {
            function core(data) {
                transformObject(data, camelize);

                stampObject(data, "underscored->camelCased");
            }

            return function () {
                return {
                    promise: function railsFieldRenamingInterceptor() {
                        return function (p) {
                            p.then(function (response) {
                                    if ((response.headers()["content-type"] || "").indexOf("application/json") >= 0) {
                                        core(response.data);
                                    }

                                    return response;
                                },
                                function (response) {
                                    //console.log("rails field naming interceptor, promise failed function", response);

                                    //return p.reject(response);
                                    return response;
                                });
                            return p;
                        };
                    },
                    core: core
                };
            };
        })

        .factory('railsRootWrappingTransformer', function () {
            return function railsRootWrappingTransformer(data, resource) {
                var result = {};
                result[angular.isArray(data) ? resource.rootPluralName : resource.rootName] = data;
                return result;
            };
        })

        .factory('railsRootWrappingInterceptor', function () {
            return function railsRootWrappingInterceptor(promise) {
                var resource = promise.resource;

                if (!resource) {
                    return promise;
                }

                return promise.then(function (response) {
                        if (response.data && response.data.hasOwnProperty(resource.rootName)) {
                            response.data = response.data[resource.rootName];
                        } else if (response.data && response.data.hasOwnProperty(resource.rootPluralName)) {
                            response.data = response.data[resource.rootPluralName];
                        }

                        return response;
                    },
                    function (response) {
                        console.log("rails field naming interceptor, promise failed function", response);

                        return response;//p.reject(response);
                    });
            };
        })
        // GIANT HACK!
        .factory('railsCsrfToken', ['$q', '$rootScope', function ($q, $rootScope) {
            return {
                request: function(config) {
                    if (!$rootScope.csrfToken) {
                        var token = "";
                        while (!token) {
                            token = prompt("Enter temporary CSRF token:");
                        }
                        $rootScope.csrfToken = token;
                    }

                    config.headers["X-CSRF-Token"] = $rootScope.csrfToken;

                    return config;
                }
            };
        }])

    /**
     * Configure the default $httpRequest
     */
        .config([
            '$httpProvider',
            'railsFieldRenamingTransformerProvider',
            'railsFieldRenamingInterceptorProvider',
            'railsCsrfTokenProvider',
            function ($httpProvider, railsFieldRenamingTransformer, railsFieldRenamingInterceptor, railsCsrfToken) {

            $httpProvider.responseInterceptors.push(railsFieldRenamingInterceptor.$get()().promise);
            $httpProvider.interceptors.push('railsCsrfToken');
            $httpProvider.defaults.transformRequest.unshift(railsFieldRenamingTransformer.$get());
        }]);

})();

