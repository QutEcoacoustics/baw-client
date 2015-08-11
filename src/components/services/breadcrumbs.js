/**
 * breadcrumbs - from https://github.com/angular-app/angular-app/blob/master/client/src/common/services/breadcrumbs.js
 */
angular
    .module("bawApp.services.breadcrumbs", [])
    .factory(
    "breadcrumbs",
    [
        "$rootScope",
        "$location",
        "$route",
        "$routeParams",
        "conf.paths",
        function ($rootScope, $location, $route, $routeParams, paths) {

            var breadcrumbs = [];
            var breadcrumbsService = {};

            var getPropertyFromObj = function getPropertyFromObj(obj, propName) {
                //console.log('looking for', propName);
                var key;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        // console.log(key);
                        if (key === propName) {
                            return obj[key];
                        }
                    }
                }
                console.log("did not find match", propName, obj);
                return null;
            };

            var replaceValuesWithPlaceholders = function replaceValuesWithPlaceholders(params, path) {
                var key, prefix = ":";
                for (key in params) {
                    if (params.hasOwnProperty(key)) {
                        var value = params[key];
                        if (path && path.indexOf(value) !== -1) {
                            // replace only the first match
                            path = path.replace(value, prefix + key);
                        }
                    }
                }
                return path;
            };

            var replacePlaceholdersWithValues = function replaceValuesWithPlaceholders(params, path) {
                var key, prefix = ":";
                for (key in params) {
                    if (params.hasOwnProperty(key)) {
                        var value = params[key];
                        var prefixedKey = prefix + key;
                        if (path && path.indexOf(prefixedKey) !== -1) {
                            // replace only the first match
                            path = path.replace(prefixedKey, value);
                        }
                    }
                }
                return path;
            };

            //we want to update breadcrumbs only when a route is actually changed
            //as $location.path() will get updated imediatelly (even if route change fails!)
            $rootScope.$on("$routeChangeSuccess", function (event, current) {

                // use routes to create breadcrumbs
                // use $routeParams to replace any instances of params in current.title
                // find property in $route.routes that matches path with

                var currentPath = $location.path(), currentParams = $route.current.params,
                    allRoutes = $route.routes;
                var pathElements = currentPath.split("/"), result = [], i;

                var breadcrumbPath = function (index) {
                    return "/" + (pathElements.slice(0, index + 1)).join("/");
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
                result.unshift({name: "Home", path: paths.api.root, title: "Home", target: "_self"});

                breadcrumbs = result;
            });

            breadcrumbsService.getAll = function () {
                return breadcrumbs;
            };

            breadcrumbsService.getFirst = function () {
                return breadcrumbs[0] || {};
            };

            return breadcrumbsService;
        }
    ]
);