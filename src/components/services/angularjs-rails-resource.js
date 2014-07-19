// Adapted from https://github.com/tpodom/angularjs-rails-resource/blob/master/vendor/assets/javascripts/angularjs/rails/resource.js

// Copyright (c) 2012 Tommy Odom
//
// MIT License
// https://github.com/tpodom/angularjs-rails-resource

(function (undefined) {


    /**
     * Old function worked via reference - deprecated
     * @param data
     * @param transform
     */
    /*function transformObject(data, transform) {
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
    }*/

    function transformObject(data, transform) {
        if (data && angular.isObject(data)) {
            var newData = angular.isArray(data) ? [] : {};
            angular.forEach(data, function (value, key) {
                var newKey = transform(key);

                if (angular.isObject(value)) {
                    newData[newKey] = transformObject(value, transform);
                }
                else {
                    newData[newKey] = value;
                }
            });

            return newData;
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
        .factory('railsFieldRenamingTransformerRequest', function () {
            return function railsFieldRenamingTransformerRequest(data, headers) {
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

                    var result = transformObject(data, underscore);
                    stampObject(result, "camelCased->underscored");
                    return result;
                }

                return data;
            };
        })
        .factory('railsFieldRenamingTransformerResponse', function() {
            return function railsFieldRenamingTransformerResponse(data, headers) {

                if (data === undefined || data === null) {
                    return;
                }

                if (!angular.isObject(data)) {
                    return data;
                }

                if ((headers()["content-type"] || "").indexOf("application/json") >= 0) {
                    var result = transformObject(data, camelize);
                    stampObject(result, "underscored->camelCased");
                    return result;
                }
                else {
                    return data;
                }
            };
        })

        /*.factory('railsFieldRenamingInterceptor', function () {
            function core(data) {
                var result = transformObject(data, camelize);

                stampObject(result, "underscored->camelCased");

                return result;
            }

            return function () {
                return {
                    promise: function railsFieldRenamingInterceptor() {
                        return function (p) {
                            p.then(function (response) {
                                    if ((response.headers()["content-type"] || "").indexOf("application/json") >= 0) {
                                        response.data = core(response.data);
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
        })*/
/*
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
        })*/
        // GIANT HACK!
        .factory('railsCsrfToken', ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
            return {
                request: function(config) {
                    if (!$rootScope.csrfToken) {
                        var token = "";

                        token = $location.search().csrf;

                        if (!token) {
                            console.warn("No temporary CSRF token has been found!");
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
            /* We are in the config phase - traditional services are not available yet
             * Thus we must make a reference to the factory's provider.
             * This is also why the $gets are necessary below!
             */
            'railsFieldRenamingTransformerRequestProvider',
            'railsFieldRenamingTransformerResponseProvider',
            'railsCsrfTokenProvider',
            function ($httpProvider, railsFieldRenamingTransformerRequest, railsFieldRenamingTransformerResponse, railsCsrfToken) {

            ////$httpProvider.responseInterceptors.push(railsFieldRenamingInterceptor.$get()().promise);

            $httpProvider.defaults.transformResponse.push(railsFieldRenamingTransformerResponse.$get());
            $httpProvider.interceptors.push('railsCsrfToken');
            $httpProvider.defaults.transformRequest.unshift(railsFieldRenamingTransformerRequest.$get());
        }]);

})();

