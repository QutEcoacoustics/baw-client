var bawss = bawss || angular.module("bawApp.services", ["ngResource", "bawApp.configuration"]);

bawss.factory("UserProfile", [
    "$rootScope",
    "$http",
    "conf.paths",
    "conf.constants",
    function ($rootScope, $http, paths, constants) {
        var profileUrl = paths.api.routes.user.profileAbsolute;
        var preferencesUrl = paths.api.routes.user.settingsAbsolute;

        var methods = {};

        var throttleCount = 0,
            throttleAmount = 1000;

        /**
         * Update the server's stored settings.
         * Calls to this function are throttled.
         * @param keyChanged - they key of the property that just changed
         * @param object - the preferences object that will be sent back to the server
         */
        methods.updatePreferences = function throttleWrapper(object) {
            console.debug("updatePreferences: throttled", object);
            throttleCount++;

            return _.throttle(
                function updatePreferences(object) {
                    console.debug("updatePreferences: sending to server, waited %s attempts", throttleCount);
                    throttleCount = 0;

                    $http.put(preferencesUrl).then(
                        function success(response) {
                            console.info("updatePreferences:success");
                        },
                        function error(response) {
                            console.error("updatePreferences:failed", response);
                        }
                    );
                }, throttleAmount);
        };

        methods.get = function (scope, property) {
            scope[property] = {preferences: null};

            $http.get(profileUrl).then(
                function success(response) {
                    console.log("User profile loaded");

                    scope[property] = (new baw.UserProfile(methods, response.data, constants.defaultProfile));
                },
                function error(response) {
                    console.error("User profile load failed", response);

                    scope[property] = (new baw.UserProfile(methods, null, constants.defaultProfile));
                }
            ).finally(function () {
                    scope.$watch(function () {
                        return scope[property].preferences;
                    }, function (newValue, oldValue) {
                        if (newValue == oldValue) {
                            return;
                        }

                        methods.updatePreferences(newValue);
                    }, true);
                });
        };

        methods.bind = function() {

        };


        return  methods;

    }
]);