angular
    .module("bawApp.services.audioRecording", [])
    .factory(
    "AudioRecording",
    [
        '$resource', "bawResource", '$http', 'conf.paths', 'QueryBuilder',
        function ($resource, bawResource, $http, paths, QueryBuilder) {
            var resource = bawResource(paths.api.routes.audioRecording.showAbsolute,
                                       {projectId: "@projectId", siteId: "@siteId", recordingId: '@recordingId'});

            var filterUrl = paths.api.routes.audioRecording.filterAbsolute;
            var query = QueryBuilder.create(function (q) {
                return q
                    .sort({orderBy: "createdAt", direction: "desc"})
                    .page({page: 1, items: 10})
                    .project({include: ["id", "siteId", "durationSeconds", "recordedDate", "createdAt"]});
            });
            resource.getRecentRecordings = function () {


                return $http.post(filterUrl, query.toJSON());
            };

            resource.getRecordingsForVisulisation = function (siteIds) {
                var query = QueryBuilder.create(function (q) {
                    return q
                        .in("siteId", siteIds)
                        .project({include: ["id", "siteId", "durationSeconds", "recordedDate"]});
                });

                return $http.post(filterUrl, query.toJSON());
            };

            return resource;
        }
    ]
);