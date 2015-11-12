angular
    .module("bawApp.services.site", [])
    .factory(
    "Site",
    [
        "$resource", "bawResource", "$http", "conf.paths", "lodash", "QueryBuilder", "baw.models.Site",
        function ($resource, bawResource, $http, paths, _, QueryBuilder, SiteModel) {
            var resource = bawResource(paths.api.routes.site.flattenedAbsolute, {siteId: "@siteId"});

            var url = paths.api.routes.site.filterAbsolute;
            resource.getSitesByIds = function (siteIds) {
                var query = QueryBuilder.create(function (q) {
                    return q.in("id", siteIds)
                        .project({include: ["id", "name"]});
                });
                return $http
                    .post(url, query.toJSON())
                    .then( x => SiteModel.makeFromApi(x));
            };

            resource.getSitesByProjectIds = function (projectIds) {
                var projectIdsUnique = _.uniq(projectIds);
                var query = QueryBuilder.create(function (q) {
                    return q.in("projects.id", projectIdsUnique);
                });
                return $http
                    .post(url, query.toJSON())
                    .then( x => SiteModel.makeFromApi(x));
            };

            resource.getAllSites = function () {
                var url = paths.api.routes.site.filterAbsolute;
                var query = QueryBuilder.create(function (q) {
                    return q.project({"include": ["id", "name"]});
                });
                return $http
                    .post(url, query.toJSON())
                    .then( x => SiteModel.makeFromApi(x));
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
