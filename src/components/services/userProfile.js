angular
    .module("bawApp.services.userProfile", [])
    .constant(
    "UserProfileEvents",
    {
        "loaded": "UserProfile:Loaded"/*,
     "preferencesChanged": "UserProfile:PreferencesChanged"*/
    })
    .factory(
    "UserProfile",
    [
        "$rootScope",
        "$http",
        "conf.paths",
        "conf.constants",
        "UserProfileEvents",
        "lodash",
        function ($rootScope, $http, paths, constants, UserProfileEvents, _) {
            var profileUrl = paths.api.routes.user.profileAbsolute,
                preferencesUrl = paths.api.routes.user.settingsAbsolute;

            var exports = {};

            var throttleCount = 0,
                throttleAmount = 1000;

            /**
             * Update the server's stored settings.
             * Calls to this function are throttled.
             */
            exports.updatePreferences = function throttleWrapper() {
                console.debug("updatePreferences: throttled");
                throttleCount++;

                _.throttle(function updatePreferences() {
                    console.debug("updatePreferences: sending to server, waited %s attempts", throttleCount);
                    throttleCount = 0;

                    $http.put(preferencesUrl, exports.profile.preferences).then(
                        function success(response) {
                            console.info("updatePreferences:success");
                        },
                        function error(response) {
                            console.error("updatePreferences:failed", response);
                        }
                    );
                }, throttleAmount)();
            };

            exports.profile = null;

            exports.get = $http
                .get(profileUrl)
                .then(function success(response) {
                          console.log("User profile loaded");

                          exports.profile = (new baw.UserProfile(response.data,
                                                                 constants.defaultProfile));
                          return exports.profile;
                      }, function error(response) {
                          console.error("User profile load failed, default profile loaded", response);

                          exports.profile = (new baw.UserProfile(null, constants.defaultProfile));
                      }
            ).finally(function () {
                          $rootScope.$broadcast(UserProfileEvents.loaded, exports);
                      });

            exports.listen = function (events) {
                angular.forEach(events, function (callback, key) {
                    $rootScope.$on(key, function (event, value) {

                        callback.apply(null, [key, exports, value]);
                    });
                });
            };

            // download asap (async)
            //exports.get();

            // return api
            return exports;
        }
    ]
);