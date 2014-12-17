angular
    .module("bawApp.services.predictiveCache", [])
    .factory(
    "predictiveCache",
    ["$http", function ($http) {

        var defaults = {
            name: null,
            match: null,
            request: [],
            progression: [],
            count: 10,
            method: "HEAD"
        };
        var acceptableVerbs = ["GET", "HEAD", "POST", "PUT", "DELETE"];
        var defaultProgression = 1;
        var unnamedProfiles = 0;

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
                if (!(settings.match instanceof RegExp)) {
                    throw new Error("The value for match must be a regular expression");
                }
            }
            else {
                throw new Error("A value for match must be provided");
            }

            if (angular.isArray(settings.request) && settings.request.length > 0) {
                var isStrings = settings.request.every(angular.isString);
                if (!isStrings) {
                    throw new Error("requests must be an array of strings");
                }
            }
            else {
                throw new Error("requests must be an array of strings");
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

            if(!angular.isNumber(settings.count) || settings.count < 0) {
                throw new Error("count must be a positive integer");
            }

            if (acceptableVerbs.indexOf(settings.method) == -1) {
                throw new Error("A valid http method is required");
            }

            return settings;
        }

        return function predictiveCache(profile) {
            if (!angular.isObject(profile)) {
                throw new Error("A profile is required");
            }

            var settings = validateProfile(profile);

            return settings;
        };
    }]
);