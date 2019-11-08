/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * (c) 2012 Witold Szczerba
 * License: MIT
 * https://github.com/witoldsz/angular-http-auth/tree/gh-pages
 */
angular
    .module("http-auth-interceptor", [])
    .provider(
    "authService",
    function () {
        const authHeader = "Authorization";

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

        this.$get = ["$rootScope", "$injector", function ($rootScope, $injector) {
            var $http; // initialized later because of circular dependency problem
            function retryRequest(config, deferred, $http) {
                config.headers[authHeader] = $http.defaults.headers.common[authHeader];

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
                    $rootScope.$broadcast("event:auth-loginConfirmed");

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
            const authHeader = "Authorization";

            // Okay: here is my hacked attempt to allow public access to the client site in an afternoon!
            // We'll make the wild assumption that GETs that fail authentication are fine and only redirect
            // if another verb is used. The exception here is `.../filter` which is just a sneaky GET
            // disguised as a POST.
            function requireAuthentication(url, method) {
                if (method === "GET" || method === "HEAD") {
                    return false;
                }
                else if (method === "POST" && url.includes("/filter")) {
                    return false;
                }
                else {
                    return true;
                }
            }

            return {
                request: function request(config) {

                    // if an auth token is present
                    if (config.headers[authHeader]) {

                        var requestUrl = new URL(config.url, paths.api.root);
                        // if we are requesting to a different host, don't send the authHeader
                        if (requestUrl.origin !== paths.api.root) {
                            delete config.headers.Authorization;
                        }

                        // don't do anything else
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

                    // if this request doesn't need to be authenticated, then do not buffer it in the 
                    // pending authentication buffer.
                    if (!requireAuthentication(config.url, config.method)) {
                        return config;
                    }

                    // otherwise, an auth token is not available
                    // queue the request up
                    console.warn("authHttpInterceptor:request: deferring request, auth token not available", config.url);
                    var deferred = $q.defer();
                    authService.pushRequestToBuffer(config, deferred);

                    if (!$rootScope.logInPending) {
                        $rootScope.$broadcast("event:auth-loginRequired");
                    }

                    return deferred.promise;
                },
                responseError: function error(response) {
                    // push the failed response to the buffer to try again
                    // but do not do it if we want to skip authentication
                    if (response.status === 401 && requireAuthentication(response.config.url, response.config.method)) {
                        var deferred = $q.defer();
                        authService.pushResponseToBuffer(response.config, deferred);

                        console.info("authService::event:auth-loginRequired");
                        $rootScope.$broadcast("event:auth-loginRequired");
                        return deferred.promise;
                    }
                    // otherwise
                    return $q.reject(response);
                }
            };
        }])
    .config(["$httpProvider", function ($httpProvider) {
        $httpProvider.interceptors.push("authHttpInterceptor");
    }]);
