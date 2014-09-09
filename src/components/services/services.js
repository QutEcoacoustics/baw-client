
    /**...
     * Helper method for adding a put request onto the standard angular resource service
     * @param $resource - the stub resource
     * @param {string} path - the web server path
     * @param {Object} paramDefaults - the default parameters
     * @param {Object} [actions] - a set of actions to also add (extend)
     * @return {*}
     */
    function resourcePut($resource, path, paramDefaults, actions) {
        var a = actions || {};
        a.update = a.update || { method: 'PUT' };
        return $resource(path, paramDefaults, a);
    }
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

    var bawss = bawss || angular.module("bawApp.services", ["ngResource", "bawApp.configuration", "bawApp.services.core", "bawApp.services.queryBuilder"]);

    bawss.factory('Project', [ '$resource', "$http", 'conf.paths', "QueryBuilder", function ($resource, $http, paths, QueryBuilder) {
        var resource = resourcePut($resource, uriConvert(paths.api.routes.projectAbsolute), {projectId: "@projectId"});

        return resource;
    }]);

    bawss.factory('Site', [ '$resource', "$http", 'conf.paths', "_", "QueryBuilder", function ($resource, $http, paths, _, QueryBuilder) {
        var resource = resourcePut($resource, uriConvert(paths.api.routes.site.flattenedAbsolute), { siteId: "@siteId"});


        resource.getSitesByIds = function(siteIds) {
            var url = paths.api.routes.site.filterAbsolute;
            siteIds = _.uniq(siteIds);
            var query = QueryBuilder.create(function(q) {
                return q.in("id", siteIds)
                    .project({include: ["id", "name", "projectIds"]});
            });
            return $http.post(url, query.toJSON());
        };


        return resource;
    }]);

    // NOTE: deleted photo resource, API for photos no longer exposed

    // NOTE: deleted user resource, API for users no longer exposed

    bawss.factory('AudioRecording', [ '$resource', '$http', 'conf.paths', 'QueryBuilder', function ($resource, $http, paths, QueryBuilder) {
        var resource = resourcePut($resource, uriConvert(paths.api.routes.audioRecording.showAbsolute),
            {projectId: "@projectId", siteId: "@siteId", recordingId: '@recordingId'});

        var query = QueryBuilder.create(function(q) {
           return q
               .sort({orderBy: "createdAt", direction: "desc"})
               .page({page:1, items: 10})
               .project({include: ["id", "siteId", "durationSeconds", "recordedDate", "createdAt"]});
        });
        resource.getRecentRecordings = function() {
            var url =  paths.api.routes.audioRecording.filterAbsolute;

            return $http.post(url, query.toJSON());
        };

        return resource;
    }]);

    bawss.factory('AudioEvent', [ '$resource', '$url', 'conf.paths',
        function ($resource, $url, paths) {
        var baseCsvUri = paths.api.routes.audioEvent.csvAbsolute;

        var csvOptions = {
            format: "csv", // "csv", "xml", "json"
            projectId: null,
            siteId: null,
            recordingId: null,
            startOffset: null,
            endOffset: null

        };
        // TODO: move this to paths conf object

        function makeCsvLink(options) {
            var query = angular.extend(csvOptions, options);
            return $url.formatUri(baseCsvUri, query);
        }

        var resource = resourcePut($resource, uriConvert(paths.api.routes.audioEvent.showAbsolute),
            {recordingId: '@recordingId',audioEventId: '@audioEventId'},
            {
                library: {
                    method:'GET',
                    url: uriConvert(paths.api.routes.audioEvent.libraryAbsolute)
                }
            }
        );
        resource.csvLink = makeCsvLink;

        return resource;
    }]);


    bawss.factory('Taggings', [ '$resource', 'conf.paths',
        function ($resource, paths) {
        var resource = resourcePut($resource, uriConvert(paths.api.routes.tagging.showAbsolute),
            {
                recordingId: '@recordingId',
                audioEventId: '@audioEventId',
                taggingId: '@taggingId'
            }
        );
        return resource;
    }]);


    function wrap(resource, method, injection) {
        var wrappedMethod = resource[method];

        resource[method] = function (params, data, success, error) {
            if (arguments.length != 4) {
                throw "we are doing some funky stuff on this resource method... expecting exactly 4 arguments [params, data, success, error]";
            }

            var newSuccess = function (value, headers) {
                injection(value, headers);
                success(value, headers);
            };

            return wrappedMethod.call(wrappedMethod, params, data, newSuccess, error);
        };
    }

    /**
     * A Service for dealing with textual Tags
     *
     * This service memoises requests for tags
     */
    bawss.factory('Tag', [ '$resource', 'conf.paths',
        function ($resource, paths) {
        var resource = $resource(uriConvert(paths.api.routes.tag.showAbsolute), {tagId: '@tagId'}, {});

        var tags = {};

        function memoize(result) {
            if (angular.isArray(result)) {
                angular.forEach(result, function (value) {
                    tags[value.id] = value;
                });
            }
            else {
                tags[result.id] = result;
            }
        }

        wrap(resource, "get", memoize);
        wrap(resource, "query", memoize);

        resource.resolve = function resolveTag(id) {
            var tag = tags[id];
            return tag;
        };

        function search(id, tagsArray) {
            return _.find(tagsArray, function (tagValue) {
                return id === tagValue.id;
            });
        }

        /**
         * By reference, ensure every item in srcArray has a proper tag object reference.
         * @param srcArray
         * @param tagsArray
         */
        resource.resolveAll = function(srcArray, tagsArray) {
            if (!tagsArray || tagsArray.length === 0) {
                return;
                //throw "Tag resolverAll, search array empty.";
            }

            for (var i = 0; i < srcArray.length; i++) {
                if (srcArray[i].resolve) {
                    var found = search(srcArray[i].id, tagsArray);
                    if (found) {
                        srcArray[i] = found;
                    }
                }
            }
        };


        var emptyTag = {
            text: "<no tags>",
            typeOfTag: ""
        };

        resource.selectSinglePriorityTag = function selectSinglePriorityTag(tags){

            // which tag to show?
            // common name, then species_name, then if all else fails... whatever is first

            if (!tags || tags.length === 0) {
                return emptyTag;
            }

            var first = tags[0];


            // optimise for most common case
            // also: on load, only incomplete tags will be listed --> the tag resolver then runs for every tag, just below
            if (first.typeOfTag == baw.Tag.tagTypes.commonName) {
                return first;
            }
            else {
                var commonName, speciesName, firstOther;
                tags.forEach(function (value) {


                    if (value.typeOfTag == baw.Tag.tagTypes.commonName && !commonName) {
                        commonName = value;
                    }
                    if (value.typeOfTag == baw.Tag.tagTypes.speciesName && !speciesName) {
                        speciesName = value;
                    }
                    if (!firstOther) {
                        firstOther = value;
                    }
                });

                return commonName || speciesName || firstOther;
            }
        };

        return resource;
    }]);

    bawss.factory('Media', [ '$resource', 'conf.paths',
        function ($resource, paths) {

            // create resource for rest requests to media api
            var mediaResource = $resource(uriConvert(paths.api.routes.media.showAbsolute),
            {
                recordingId: '@recordingId',
                format: '@format'
            });

            // this is a read only service, remove unnecessary methods
            // keep get
            delete  mediaResource["save"];
            delete  mediaResource["query"];
            delete  mediaResource["remove"];
            delete  mediaResource["delete"];

            /**
             * Change relative image and audio urls into absolute urls
             * @param {Object} mediaItem
             */
            mediaResource.formatPaths = function formatPaths(mediaItem, audioEventId) {
                // HACK: add audioEventId onto every path until Media API correctly returns resource paths!
                var hackString = audioEventId !== undefined ? "&audioEventId=" + audioEventId.toString() : "";

                var imgKeys = Object.keys(mediaItem.availableImageFormats);
                if (imgKeys.length > 1) {
                    throw "don't know how to handle more than one image format!";
                }

                var imageKey = imgKeys[0];
                var imageFormat = mediaItem.availableImageFormats[imageKey];
                mediaItem.availableImageFormats[imageKey].url = paths.joinFragments(paths.api.root, (imageFormat.url + hackString));
                mediaItem.spectrogram = imageFormat;

                angular.forEach(mediaItem.availableAudioFormats, function (value, key) {
                    // just update the url so it is an absolute uri
                    this[key].url = paths.joinFragments(paths.api.root, (value.url + hackString));

                }, mediaItem.availableAudioFormats);
            };

        return mediaResource;
    }]);

    bawss.factory('BirdWalkService', ['$rootScope', '$location', '$route', '$routeParams', '$http',
        function ($rootScope, $location, $route, $routeParams, $http) {

        var birdWalkService = {};

        var getUrl = function getUrl(downloadUrl, storeProperty, theScope, onSuccess) {
            $http.get(downloadUrl, {
                cache: true
            })
                .success(function (data, status, headers, config) {
                    console.info("Downloading resource " + downloadUrl + " succeeded.", data);
                    if (!theScope['spec']) {
                        theScope['spec'] = {};
                    }
                    theScope.spec[storeProperty] = data;

//                    if (data.additionalResources) {
//                        angular.forEach(data.additionalResources, function (value, key) {
//                            getUrl(value, key);
//                        });
//                    }
                    if (onSuccess) {
                        onSuccess();
                    }

                }).error(function (data, status, headers, config) {
                    console.error("Downloading resource " + downloadUrl + " failed.");
                });
        };

        birdWalkService.getUrl = getUrl;

        return birdWalkService;
    }]);

    // breadcrumbs - from https://github.com/angular-app/angular-app/blob/master/client/src/common/services/breadcrumbs.js
    bawss.factory('breadcrumbs', ['$rootScope', '$location', '$route', '$routeParams',  'conf.paths', function ($rootScope, $location, $route, $routeParams, paths) {

        var breadcrumbs = [];
        var breadcrumbsService = {};

        var getPropertyFromObj = function getPropertyFromObj(obj, propName) {
            //console.log('looking for', propName);
            var key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    // console.log(key);
                    if (key == propName) {
                        return obj[key];
                    }
                }
            }
            console.log('did not find match', propName, obj);
            return null;
        };

        var replaceValuesWithPlaceholders = function replaceValuesWithPlaceholders(params, path) {
            var key, prefix = ':';
            for (key in params) {
                if (params.hasOwnProperty(key)) {
                    var value = params[key];
                    if (path && path.indexOf(value) != -1) {
                        // replace only the first match
                        path = path.replace(value, prefix + key);
                    }
                }
            }
            return path;
        };

        var replacePlaceholdersWithValues = function replaceValuesWithPlaceholders(params, path) {
            var key, prefix = ':';
            for (key in params) {
                if (params.hasOwnProperty(key)) {
                    var value = params[key];
                    var prefixedKey = prefix + key;
                    if (path && path.indexOf(prefixedKey) != -1) {
                        // replace only the first match
                        path = path.replace(prefixedKey, value);
                    }
                }
            }
            return path;
        };

        //we want to update breadcrumbs only when a route is actually changed
        //as $location.path() will get updated imediatelly (even if route change fails!)
        $rootScope.$on('$routeChangeSuccess', function (event, current) {

            // use routes to create breadcrumbs
            // use $routeParams to replace any instances of params in current.title
            // find property in $route.routes that matches path with

            var currentPath = $location.path(), currentParams = $route.current.params,
                allRoutes = $route.routes;
            var pathElements = currentPath.split('/'), result = [], i;

            var breadcrumbPath = function (index) {
                return '/' + (pathElements.slice(0, index + 1)).join('/');
            };

            // remove first item (usually an empty string)
            pathElements.shift();

            //console.log(pathElements, currentPath, currentParams);

            for (i = 0; i < pathElements.length; i++) {
                //var currentPathElement = pathElements[i];
                var path = breadcrumbPath(i);
                var pathPlaceholders = replaceValuesWithPlaceholders(currentParams, path);
                var foundRoute = getPropertyFromObj(allRoutes, pathPlaceholders);

                var newTitle;
                if (foundRoute) {
                    newTitle = replacePlaceholdersWithValues(currentParams, foundRoute.title);
                }
                else {
                    newTitle = pathElements[i];
                }

                result.push({name: pathElements[i], path: breadcrumbPath(i), title: newTitle});
            }

            // add home as first item in result array
            result.unshift({name: 'Home', path: paths.api.root, title: 'Home', target: "_self"});

            breadcrumbs = result;
        });

        breadcrumbsService.getAll = function () {
            return breadcrumbs;
        };

        breadcrumbsService.getFirst = function () {
            return breadcrumbs[0] || {};
        };

        return breadcrumbsService;
    }]);


    // authentication...
    bawss.factory('Authenticator', ['$rootScope', 'authService', '$http', 'conf.paths',
        function ($rootScope, authService, $http, paths) {
            function loginSuccess(data, status, headers, config) {
                // a provider has just logged in
                // the response arg, is the response from our server (devise)
                // extract auth_token and set in rootScope

                if (!data || data.response !== "ok") {
                    throw "Authenticator.loginSuccess: this function should not be called unless a successful response was received";
                }

                $rootScope.$safeApply($rootScope, function () {
                    $rootScope.authorisationToken = data.authToken;
                    $rootScope.userData = data;

                    if ($rootScope.authorisationToken === undefined) {
                        throw "The authorisation token can not be undefined at this point";
                    }

                    $http.defaults.headers.common["Authorization"] = 'Token token="' +
                        $rootScope.authorisationToken +
                        '"';

                    console.log("Login successful", data);

                    authService.loginConfirmed();
                });
            }

            function loginFailure(data, status, headers, config) {
                $rootScope.$safeApply($rootScope, function () {
                    $rootScope.authorisationToken = null;
                    $rootScope.userData = null;
                    $http.defaults.headers.common["Authorization"] = null;

                    if (config && config.url === paths.api.routes.security.pingAbsolute) {
                        return;
                    }

                    if (status === 401) {
                        console.warn("Login failure, authentication has failed with the provider. ",
                            data, status,
                            headers, config);
                    }
                    else {
                        console.error("Login failure: ", data, status, headers, config);
                    }
                });
            }

            return {
                loginSuccess: loginSuccess,
                loginFailure: loginFailure,
                logoutSuccess: function logoutSuccess(data, status, headers, config) {
                    $rootScope.$safeApply($rootScope, function () {
                        $rootScope.authorisationToken = null;
                        $rootScope.userData = null;
                        $http.defaults.headers.common["Authorization"] = null;

                        console.log("Logout successful", data);
                    });
                },
                logoutFailure: function logoutFailure(data, status, headers, config) {
                    console.error("Logout failure: ", data, status, headers, config);
                },
                /**
                 * Checks whether a user is logged in or not. Note: this is the only method
                 * in our site which relies on cookies!
                 * @return {boolean}
                 */
                checkLogin: function checkLogin() {
                    if ($rootScope.loggedIn !== true) {
                        $http.get(paths.api.routes.security.pingAbsolute,
                            {params: {antiCache: (new Date()).getTime()}, cache: false })
                            .success(function checkLoginSuccess(data, status, headers, config) {
                                // the ping request is different, because it just asks for information, it will always return a 200,
                                // so split on response field
                                if (data && data.response == "ok") {
                                    console.info("Logged in via ping (probably used cookies).");
                                    loginSuccess(data, status, headers, config);
                                }
                                else {
                                    console.info("Logged in via ping failed (probably something wrong with cookies or not logged in).");
                                    loginFailure(data, status, headers, config);
                                }

                            })
                            .error(function checkLoginFailure(data, status, headers, config) {
                                console.error("Ping login service failure - this should not happen",
                                    data,
                                    status, headers, config);
                            })
                        ;
                    }

                    return true;
                }
            };
        }]);

    bawss.factory('AuthenticationProviders',
        ['$rootScope', 'authService', '$http', 'Authenticator', '$q','$url',
            function ($rootScope, authService, $http, Authenticator, $q, $url) {
                var signOutPath = '/security/sign_out';

                function signOut() {
                    $http({method: 'GET', url: signOutPath})
                        .success(Authenticator.logoutSuccess)
                        .error(Authenticator.logoutFailure);
                }

                // Navigator is the persona global object
                if (navigator) {
                    if (navigator.id) {
                        navigator.id.watch({
                            loggedInUser: null,
                            onlogin: function (assertion) {
                                // A user has logged in! Here you need to:
                                // 1. Send the assertion to your backend for verification and to create a session.
                                // 2. Update your UI.
                                $http({method: 'POST', url: '/security/auth/browser_id/callback', data: {assertion: assertion}})
                                    .success(Authenticator.loginSuccess)
                                    .error(Authenticator.loginFailure);

                            },
                            // A user has logged out! Here you need to:
                            // Tear down the user's session by redirecting the user or making a call to your backend.
                            // Also, make sure loggedInUser will get set to null on the next page load.
                            onlogout: signOut
                        });
                    }
                }
                else {
                    console.error("Unable to start Persona authentication binding. This is usually caused by a lack of internet.");
                }

                function openIdLogin(url) {
                    var popPath = "/security/auth/open_id?openid_url=" +
                        $url.fixedEncodeURIComponent(url);
                    baw.popUpWindow(popPath, 700, 500, function (data) {
                        data = data || {};

                        throw "add object camel casing here";
                        /*railsFieldRenamingInterceptor().core(data);

                        if (data.response === "ok") {
                            Authenticator.loginSuccess(data);
                        }
                        else {
                            Authenticator.loginFailure(data);
                        }*/
                    });
                }

                function openAuthLogin(providerId) {
                    var popPath = "/security/auth/" + providerId;
                    baw.popUpWindow(popPath, 700, 500, function (data) {
                        data = data || {};

                        throw "add object camel casing here";
                        /*railsFieldRenamingInterceptor().core(data);

                        if (data.response === "ok") {
                            Authenticator.loginSuccess(data);
                        }
                        else {
                            Authenticator.loginFailure(data);
                        }*/
                    });
                }

                return {
                    "persona": {
                        login: function login() {
                            navigator.id.request();
                        },
                        logout: function logout() {
                            navigator.id.logout();
                        },
                        requires: null
                    },
                    "google": {
                        login: function () {
                            openIdLogin('https://www.google.com/accounts/o8/id');
                        },
                        logout: signOut,
                        requires: null
                    },
                    "yahoo": {
                        login: function () {
                            openIdLogin('https://me.yahoo.com');
                        },
                        logout: signOut,
                        requires: null
                    },
                    "open_id": {
                        login: openIdLogin,
                        logout: signOut,
                        requires: {
                            text: "Enter your OpenID URL:",
                            type: "url"
                        }
                    },
                    "facebook": {
                        login: function () {
                            openAuthLogin('facebook');
                        },
                        logout: signOut,
                        requires: null
                    },
                    "github": {
                        login: function () {
                            openAuthLogin('github');
                        },
                        logout: signOut,
                        requires: null
                    },
                    "twitter": {
                        login: function () {
                            openAuthLogin('twitter');
                        },
                        logout: signOut,
                        requires: null
                    },
                    "windowslive": {
                        login: function () {
                            openAuthLogin('windowslive');
                        },
                        logout: signOut,
                        requires: null
                    }
                };
            }]);
