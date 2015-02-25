angular
    .module("bawApp.services.site", [])
    .factory(
    "Site",
    [
        '$resource', "bawResource", "$http", 'conf.paths', "lodash", "QueryBuilder",
        function ($resource, bawResource, $http, paths, _, QueryBuilder) {
            var resource = bawResource(paths.api.routes.site.flattenedAbsolute, {siteId: "@siteId"});

            var url = paths.api.routes.site.filterAbsolute;
            resource.getSitesByIds = function (siteIds) {

                var siteIdsUnique = _.uniq(siteIds);
                var query = QueryBuilder.create(function (q) {
                    return q.in("id", siteIdsUnique)
                        .project({include: ["id", "name"]});
                });
                return $http.post(url, query.toJSON());
            };

            resource.getSitesByProjectIds = function (projectIds) {
                var projectIdsUnique = _.uniq(projectIds);
                var query = QueryBuilder.create(function (q) {
                    return q.in("projectIds", projectIdsUnique);
                });
                return $http.post(url, query.toJSON());
            };

            resource.getAllSites = function () {
                var url = paths.api.routes.site.filterAbsolute;
                var query = QueryBuilder.create(function (q) {
                    return q.project({"include": ["id", "name"]});
                });
                return $http.post(url, query.toJSON());
            };

            /*resource.getAllSites = function () {
                var url = paths.api.routes.site.filterAbsolute;
                var query = QueryBuilder.create(function (q) {
                    return q.project({"include": ["id", "name"]});
                });
                return $http.post(url, query.toJSON());
            };*/


            return resource;
        }
    ]
);