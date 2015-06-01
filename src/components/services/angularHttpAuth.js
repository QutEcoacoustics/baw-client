/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * (c) 2012 Witold Szczerba
 * License: MIT
 * https://github.com/witoldsz/angular-http-auth/tree/gh-pages
 */
angular
    .module("http-auth-interceptor", [])
    .provider(
    'authService',
    function () {
        /**
         * Holds all the requests which failed due to 401 response,
         * so they can be re-requested in future, once login is completed.
         */
        var buffer = [];

        /**
         * Required by HTTP interceptor.
         * Function is attached to provider to be invisible for regular users of this service.
         */
        function pushToBuffer(type, config, deferred) {
            buffer.push({
                type: type,
                config: config,
                deferred: deferred
            });
        }
        this.pushToBuffer = pushToBuffer;

        this.$get = ['$rootScope', '$injector', function ($rootScope, $injector) {
            var $http; // initialized later because of circular dependency problem
            function retryRequest(config, deferred, $http) {
                config.headers["Authorization"] = $http.defaults.headers.common["Authorization"];

                deferred.resolve(config);
            }

            function retryResponse(config, deferred) {
                $http(config).then(function (response) {
                    deferred.resolve(response);
                });
            }

            function retryAll() {
                $http = $http || $injector.get("$http");

                for (var i = 0; i < buffer.length; ++i) {
                    switch (buffer[i].type) {
                        case "request":
                            retryRequest(buffer[i].config, buffer[i].deferred, $http);
                            break;
                        case "response":
                            retryResponse(buffer[i].config, buffer[i].deferred);
                            break;
                        default:
                            throw new Error ("invalid switch case");
                    }
                }
                buffer = [];
            }

            return {
                loginConfirmed: function () {
                    console.info("authService::event:auth-loginConfirmed - flushing buffer, request count:", buffer.length);
                    $rootScope.$broadcast('event:auth-loginConfirmed');

                    retryAll();
                },
                pushRequestToBuffer: pushToBuffer.bind(null, "request"),
                pushResponseToBuffer: pushToBuffer.bind(null, "response")
            };
        }];
    })
/**
 * $http interceptor.
 * On 401 response - it stores the request and broadcasts 'event:angular-auth-loginRequired'.
 */
    .factory(
    "authHttpInterceptor",
    [
        "authService",
        "$rootScope",
        "$q",
        "conf.paths",
        function (authService, $rootScope, $q, paths) {
            return {
                'request': function request(config) {
                    // if an auth token is present
                    if (config.headers["Authorization"]) {
                        // don't do anything
                        return config;
                    }

                    // if not API call (i.e. JSON) ///config.headers["Accept"] === "application/json" &&
                    // if the route to actually sign in!
                    // or if requesting a cached resource (usually a template)
                    if (config.url.indexOf(paths.api.routes.security.signIn) >= 0 ||
                        config.cached === true) {
                        // then continue unimpeded
                        console.debug("authHttpInterceptor:request:Not deferring request to wait for auth credentials", config.url);
                        return config;
                    }

                    // otherwise, an auth token is not available
                    // queue the request up
                    console.warn("authHttpInterceptor:request: deferring request, auth token not available", config.url);
                    var deferred = $q.defer();
                    authService.pushRequestToBuffer(config, deferred);

                    if (!$rootScope.logInPending) {
                        $rootScope.$broadcast('event:auth-loginRequired');
                    }

                    return deferred.promise;
                },
                'responseError': function error(response) {
                    if (response.status === 401) {
                        var deferred = $q.defer();
                        authService.pushResponseToBuffer(response.config, deferred);

                        console.info("authService::event:auth-loginRequired");
                        $rootScope.$broadcast('event:auth-loginRequired');
                        return deferred.promise;
                    }
                    // otherwise
                    return $q.reject(response);
                }
            };
        }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push("authHttpInterceptor");
    }]);
