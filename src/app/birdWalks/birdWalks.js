angular.module('bawApp.birdWalks', [])
    .controller(
        'BirdWalkCtrl',
        ['$scope', '$resource', '$routeParams','$route', '$http',
            function BirdWalkCtrl($scope, $resource, $routeParams, $route, $http) {
                // set up results
                $scope.results = {
                    allowContact: true,
                    consented: false,
                    ethicsStatementViewed: false,
                    pageHit: (new Date()).toISOString()
                };

                $scope.spec = {};

                $scope.imagesPath = '/assets/bird_walk/images/';

                // download bird walk specification
                downloadResources('/assets/bird_walk/bird_walk_spec.json', 'birdWalkSpec');

                function downloadResources(primaryResource, primaryStoreProperty) {
                    var maxAttempts = 5;

                    function downloadRecursive(attemptsLeft, resource, storeProperty) {
                        if (attemptsLeft > 0) {
                            $http.get(resource + "?antiCache=" + Date.now().toString())
                                .success(function (data, status, headers, config) {
                                    $scope.spec[storeProperty] = data;

                                    console.info("Downloading resource " + resource + " succeeded.", data);

                                    if (data.additionalResources) {
                                        angular.forEach(data.additionalResources, function (value, key) {
                                            downloadRecursive(maxAttempts, value, key);
                                        });
                                    }
                                })
                                .error(function (data, status, headers, config) {
                                    console.error("Downloading resource " + resource + " failed. Attempt " + (maxAttempts - attemptsLeft) + " of " + maxAttempts);

                                    downloadRecursive(attemptsLeft--, resource, storeProperty);
                                });
                        }
                        else {
                            console.error("Downloading resource " + resource + " failed after " + maxAttempts + "attempts");
                        }
                    }

                    downloadRecursive(maxAttempts, primaryResource, primaryStoreProperty);


                }
            }
        ]);