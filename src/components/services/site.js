angular
    .module("bawApp.services.site", [])
    .factory(
    "Site",
    [
        "$q", "$resource", "bawResource", "$http", "conf.paths", "lodash", "QueryBuilder", "baw.models.Site",
        function ($q, $resource, bawResource, $http, paths, _, QueryBuilder, SiteModel) {
            var resource = bawResource(paths.api.routes.site.flattenedAbsolute, {siteId: "@siteId"});

            var url = paths.api.routes.site.filterAbsolute;
            resource.getSitesByIds = function (siteIds) {
                if (!siteIds || siteIds.length === 0) {
                    console.warn("bawApp.services.site.getSitesByIds:: No siteIds provided returning promise rejection");
                    return $q.resolve(null);
                }

                var query = QueryBuilder.create(function (q) {
                    return q.in("id", siteIds)
                        .project({include: ["id", "name"]})
                        .sort({orderBy: "name"});
                });
                return $http
                    .post(url, query.toJSONString())
                    .then( x => SiteModel.makeFromApi(x));
            };

            resource.getSitesByProjectIds = function (projectIds, host = null) {
                var projectIdsUnique = _.uniq(projectIds);
                var query = QueryBuilder.create(function (q) {
                    return q.in("projects.id", projectIdsUnique)
                        .project({include: ["id", "name"]})
                        .sort({orderBy: "name"});
                });
                return $http
                    .post(bawResource.crossDomainUrlAbsolute("site", "filter", host), query.toJSONString())
                    .then( x => SiteModel.makeFromApi(x));
            };

            resource.getAllSites = function () {
                var url = paths.api.routes.site.filterAbsolute;
                var query = QueryBuilder.create(function (q) {
                    return q.project({"include": ["id", "name"]})
                        .sort({orderBy: "name"});
                });
                return $http
                    .post(url, query.toJSONString())
                    .then( x => SiteModel.makeFromApi(x));
            };

            /*resource.getAllSites = function () {
             var url = paths.api.routes.site.filterAbsolute;
             var query = QueryBuilder.create(function (q) {
             return q.project({"include": ["id", "name"]});
             });
             return $http.post(url, query.toJSONString());
             };*/


            return resource;
        }
    ]
);
