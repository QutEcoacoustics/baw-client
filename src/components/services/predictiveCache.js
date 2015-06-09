angular
    .module("bawApp.services.predictiveCache", ["angular-loading-bar"])
    .factory(
    "predictiveCacheInterceptor",
    [
        function () {
            var _listeners = [];
            return {
                listeners: function () {
                    return _listeners;
                },
                /*request: function pciRequest(httpConfig) {


                 },*/
                response: function pciResponse(response) {

                    _listeners.forEach(function (listener) {
                        listener(response);
                    });

                    return response;
                }
                /*
                 requestError: ,
                 responseError:
                 */
            };
        }
    ])
    .factory(
    "predictiveCache",
    [
        "$http",
        "predictiveCacheInterceptor",
        "$q",
        "cfpLoadingBar",
        function ($http, predictiveCacheInterceptor, $q, cfpLoadingBar) {

            var defaults = {
                name: null,
                /**
                 * Match can be a regex or a function.
                 * @param: {string} url
                 * @returns {null|Array} matches
                 */
                match: null,
                request: [],
                progression: [],
                count: 10,
                method: "HEAD",
                progressive: true
            };
            var acceptableVerbs = ["GET", "HEAD", "POST", "PUT", "DELETE"];
            var defaultProgression = 1;
            var unnamedProfiles = 0;

            var profiles = {};

            function debug(...args) {
                // disable debug messages for unit tests
                if (!window.jasmine) {
                    console.debug.apply(console, args);
                }

            }

            function validateProfile(settings) {
                settings = angular.extend({}, defaults, settings);

                if (settings.name) {
                    if (!angular.isString(settings.name)) {
                        throw new Error("The provided name must be a string");
                    }
                }
                else {
                    unnamedProfiles++;
                    settings.name = "UnnamedProfile" + unnamedProfiles;
                }

                if (settings.match) {
                    if (!(settings.match instanceof RegExp) && !angular.isFunction(settings.match)) {
                        throw new Error("The value for match must be a regular expression or a function");
                    }
                }
                else {
                    throw new Error("A value for match must be provided");
                }

                function isStringOrFunction(value) {
                    return angular.isString(value) || angular.isFunction(value);
                }

                if (angular.isArray(settings.request) && settings.request.length > 0) {
                    var isStringsOrFunctions = settings.request.every(isStringOrFunction);
                    if (!isStringsOrFunctions) {
                        throw new Error("requests must be an array of strings or functions");
                    }
                }
                else {
                    throw new Error("requests must be an array of strings or functions");
                }

                // http://stackoverflow.com/a/16046903
                //var numGroups = (new RegExp(settings.match.toString() + '|')).exec('').length - 1;
                var isArray = angular.isArray(settings.progression),
                    isEmpty = isArray && settings.progression.length === 0,
                    isNumber = angular.isNumber(settings.progression) && !isArray,
                    isNumberFunctionArray = isArray && settings.progression.every(function (value) {
                            return angular.isFunction(value) || angular.isNumber(value);
                        });
                if (settings.progression === null || settings.progression === undefined) {
                    settings.progression = defaultProgression;
                }
                else if (isEmpty || !isNumber && !isNumberFunctionArray) {
                    throw new Error("progression must be an array of numbers/functions");
                }

                if (!angular.isNumber(settings.count) || settings.count < 0) {
                    throw new Error("count must be a positive integer");
                }

                if (acceptableVerbs.indexOf(settings.method) == -1) {
                    throw new Error("A valid http method is required");
                }

                if (settings.progressive !== true && settings.progressive !== false) {
                    throw new Error("progressive must be boolean");
                }

                return settings;
            }

            /**
             * Create a chain of promises that will actually cache the resources
             * @param profile
             * @param url
             * @param match
             */
            function createCacheRequests(profile, response, match) {
                var url = response.config.url,
                    data = response.data;

                // parse matched values from regex
                var base = [],
                    previous = [];
                for (var m = 0; m < match.length; m++) {
                    // try and convert match to number, if fail, leave as is
                    var num = Number(match[m]),
                        value = isNaN(num) ? match[m] : num;
                    base[m] = previous[m] = value;
                }

                // each capture group represents a parameter that may progress
                var progressions = previous.map(function (value, index) {
                    var progression = defaultProgression;
                    if (profile.progression.length) {
                        progression = profile.progression[index];
                    }
                    else if (profile.progression) {
                        progression = profile.progression;
                    }

                    return progression;
                });

                function formatRequests(req, index) {
                    if (req.apply) {
                        return req.call(
                            undefined,
                            this,
                            {profile: profile, triggerUrl: url, responseData: data});
                    }
                    else {
                        return req.format(this);
                    }
                }

                function invokeHttp(url) {
                    debug("predictiveCache:promiseResolution enqueued " + url);
                    var config = {
                        url: url,
                        method: profile.method
                    };
                    //HACK: this is nasty... only done so unit tests pass
                    if (cfpLoadingBar.ignore) {
                        config = cfpLoadingBar.ignore(config);
                    }
                    return $http(config).then(function (value) {
                        debug("predictiveCache:promiseResolution completed " + url);
                        return value;
                    });
                }

                // count is the number of times to progress
                var commands = [];
                count:for (var i = 0; i < profile.count; i++) {

                    // apply each progression for each variable
                    var current = [];
                    for (var p = 0; p < progressions.length; p++) {

                        // get the number or function to increment by
                        var progression = progressions[p],
                            prev = previous[p];

                        if (progression.call) {
                            current[p] = progression.call(
                                undefined,
                                prev,
                                {count: i, profile: profile, triggerUrl: url, responseData: data});
                        }
                        else {
                            current[p] = prev + progression;
                        }

                        // break the count loop early if any of the progressions fail
                        if (current[p] === undefined) {
                            break count;
                        }
                    }

                    // apply the current values to the request strings
                    var currentCommands = profile.request.map(formatRequests, current);

                    Array.prototype.push.apply(commands, currentCommands);

                    // lastly, overwrite previous values for next loop
                    previous = current;
                }

                // finally ready to issue http requests!
                var promises;
                if (profile.progressive) {
                    // make requests consecutively, in a progressive fashion
                    // but batch each progression's requests into groups
                    var requestsPerProgression = profile.request.length;
                    promises = commands.reduce(function (promiseChain, current, index, array) {
                        if (index % requestsPerProgression === 0) {
                            var batchCommands = array.slice(index, index + requestsPerProgression);
                            if (batchCommands.length !== 0) {
                                return promiseChain.then(function () {
                                    //debug("execute next http requests", index / requestsPerProgression, batchCommands);
                                    if (batchCommands === 1) {
                                        return invokeHttp(batchCommands[0]);
                                    }
                                    else {
                                        return $q.all(batchCommands.map(invokeHttp));
                                    }
                                });
                            }
                            else {
                                return promiseChain;
                            }
                        }
                        else {
                            return promiseChain;
                        }
                    }, $q.when());
                }
                else {
                    // just request everything at once
                    promises = $q.all(commands.map(invokeHttp));
                }

                debug("predictiveCache:promiseResolution Promises enqueued");

                return promises
                    .catch(function (error) {
                        console.error("predictiveCache:promiseResolution " + error, error);
                    })
                    .finally(function () {
                        debug("predictiveCache:promiseResolution complete");
                    });
            }

            /**
             * Allows a function to simulate the API of a RegExp
             * @param {Object} response - the url to match against
             * @param {RegExp|function} matcher - the object that determines a match
             * @returns {null|Array} - the matches if present
             */
            function isMatch(response, matcher) {
                if (angular.isFunction(matcher)) {
                    var matches = matcher(response.config.url, response);
                    if (angular.isArray(matches) || matches === null) {
                        return matches;
                    }

                    throw new Error("The match function must conform to the RegExp.match API");
                }
                else if (matcher instanceof RegExp) {
                    var match = matcher.exec(response.config.url);
                    return match === null ? match : match.slice(1);
                }
                else {
                    throw new Error("The supplied matcher is neither a RegExp or a function!");
                }
            }

            /**
             * Checks the url and returns a series of promises
             * @returns {Promise}
             * @param response
             */
            function checkProfiles(response) {
                return $q(function (resolve, reject) {
                    // initially determine if the url matches any of the profiles
                    var matches = [];
                    angular.forEach(profiles, function (p, key) {
                        var match = isMatch(response, p.match);
                        if (match) {
                            // then trigger async resolution
                            matches.push(createCacheRequests(p, response, match));
                        }
                    });

                    if (matches.length > 0) {
                        resolve($q.all(matches));
                    }
                    else {
                        reject();
                    }
                });
            }

            /**
             * The callback from the http interceptor
             * @param url - the url from the config.
             */
            function interceptorCallback(response) {
                // knock it off to async ASAP so we don't block http stuff
                checkProfiles(response);
            }

            // setup callback
            predictiveCacheInterceptor.listeners().push(interceptorCallback);

            // return initializer
            return function predictiveCache(profile) {
                if (!angular.isObject(profile)) {
                    throw new Error("A profile is required");
                }

                var settings = validateProfile(profile);

                profiles[settings.name] = settings;

                return settings;
            };
        }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push("predictiveCacheInterceptor");
    }]);