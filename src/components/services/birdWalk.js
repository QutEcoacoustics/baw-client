angular
    .module("bawApp.services.birdWalkService", [])
    .factory(
    'BirdWalkService',
    [
        "$rootScope", '$location', '$route', '$routeParams', '$http',
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
        }
    ]
);