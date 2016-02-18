angular
    .module("bawApp.services.project", [])
    .factory(
        "Project",
        [
            "$resource",
            "bawResource",
            "$http",
            "conf.paths",
            "$url",
            "lodash",
            "QueryBuilder",
            "baw.models.Project",
            function (
                $resource,
                bawResource,
                $http,
                paths,
                $url,
                _,
                QueryBuilder,
                ProjectModel) {

                var resource = bawResource(
                    paths.api.routes.project.showAbsolute,
                    {projectId: "@projectId"}
                );

                var gapUrl = paths.api.routes.project.filterAbsolute;
                var gapQuery = QueryBuilder.create(function (q) {
                    return q.project({"include": ["id", "name"]});
                });
                resource.getAllProjects = function () {
                    return $http
                        .post(gapUrl, gapQuery.toJSONString())
                        .then(x => ProjectModel.makeFromApi(x));
                };

                resource.getByIds = function (projectIds) {
                    var gpbiUrl;
                    var projectIdsUnique = _.uniq(projectIds);

                    gpbiUrl = paths.api.routes.project.filterAbsolute;

                    var query = QueryBuilder.create(function (q) {
                        return q.in("id", projectIdsUnique);
                    });

                    return $http
                        .post(gpbiUrl, query.toJSONString())
                        .then(x => ProjectModel.makeFromApi(x));

                };

                resource.getProjectsBySiteIds = function (siteIds) {
                    var gpbsiUrl = paths.api.routes.project.filterAbsolute;


                    var query = QueryBuilder.create(function (q) {
                        return q.in("id", siteIds);
                    });

                    return $http
                        .post(gpbsiUrl, query.toJSONString())
                        .then(x => ProjectModel.makeFromApi(x));
                };


                return resource;
            }
        ]
    );
