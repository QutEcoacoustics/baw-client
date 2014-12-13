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
            count: 0,
            method: "HEAD"
        };

        return {
            addProfile: function predictiveCache(profile) {

            }
        }
    }]
);