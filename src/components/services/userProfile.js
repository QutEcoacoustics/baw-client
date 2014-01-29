var bawss = bawss || angular.module("bawApp.services", ["ngResource", "bawApp.configuration"]);

bawss.factory("UserProfile", [
    "$rootScope",
    "$http",
    "conf.paths",
    "conf.constants",
    function ($rootScope, $http, paths, constants) {
        var profileUrl = paths.api.routes.user.profileAbsolute,
            preferencesUrl = paths.api.routes.user.settingsAbsolute,
            eventKeys = {
                "loaded": "UserProfile:Loaded",
                "preferencesChanged": "UserProfile:PreferencesChanged"
            };

        var methods = {
            eventKeys: eventKeys
        };

        var throttleCount = 0,
            throttleAmount = 1000;

        /**
         * Update the server's stored settings.
         * Calls to this function are throttled.
         * @param object - the preferences object that will be sent back to the server
         */
        methods.updatePreferences = function throttleWrapper() {
            console.debug("updatePreferences: throttled");
            throttleCount++;

            _.throttle(function updatePreferences() {
                console.debug("updatePreferences: sending to server, waited %s attempts", throttleCount);
                throttleCount = 0;

                $http.put(preferencesUrl, methods.profile.preferences).then(
                    function success(response) {
                        console.info("updatePreferences:success");
                    },
                    function error(response) {
                        console.error("updatePreferences:failed", response);
                    }
                );
            }, throttleAmount)();
        };

        methods.profile = null;

        methods.get = function () {

            $http.get(profileUrl).then(
                function success(response) {
                    console.log("User profile loaded");

                    methods.profile = (new baw.UserProfile(methods, response.data, constants.defaultProfile));
                },
                function error(response) {
                    console.error("User profile load failed", response);

                    methods.profile = (new baw.UserProfile(methods, null, constants.defaultProfile));
                }
            ).finally(function () {
                    $rootScope.$broadcast(eventKeys.loaded, methods);
                });
        };

        methods.listen = function (events) {
            angular.forEach(events, function (callback, key) {
                $rootScope.$on(key, function (event, value) {

                    callback.apply(null, [key, methods, value]);
                });
            });
        };

        methods.get();

        return methods;

    }
]);