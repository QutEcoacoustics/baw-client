angular
    .module("bawApp.services.project", [])
    .factory(
    "Project",
    [
        '$resource', "bawResource", "$http", 'conf.paths', "QueryBuilder",
        function ($resource, bawResource, $http, paths, QueryBuilder) {
            var resource = bawResource(paths.api.routes.project.showAbsolute,
                                       {projectId: "@projectId"});

            var gapUrl = paths.api.routes.project.filterAbsolute;
            var gapQuery = QueryBuilder.create(function (q) {
                return q.project({"include": ["id", "name"]});
            });
            resource.getAllProjects = function () {
                return $http.post(gapUrl, gapQuery.toJSON());
            };

            return resource;
        }
    ]
);