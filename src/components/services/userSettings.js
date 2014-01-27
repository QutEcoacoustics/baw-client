var bawss = bawss || angular.module("bawApp.services", ["ngResource", "bawApp.configuration"]);

bawss.factory("UserSettings", [
    "$http",
    "conf.paths",
    function($http, paths) {

//        function get(callback) {
//            $http.get(paths.api.routes.users.settings).then(
//                function success(data, status, headers, config) {
//                    callback(data);
//                },
//                function error(data, status, headers, config) {
//                    console.error("Get user settings failed", data, status, headers, config);
//                }
//            )
//        }

        var UserSettings = resourcePut($resource, uriConvert(paths.api.routes.projectAbsolute), {projectId: "@projectId"});

        var userSettings = UserSettings.get({recordingId: recordingId}, {});

        return  userSettings;
    }
]);