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

                    // HACK: ask for a ridiculous amount of items since
                    // paging cap automatically is enabled at 500 items.
                    // TODO: add an option to disable paging
                    // track issue here: https://github.com/QutBioacoustics/baw-server/issues/160
                    return q
                        .in("siteId", siteIds)
                        .project({include: ["id", "siteId", "durationSeconds", "recordedDate"]})
                        .page({items: 100000, page: 1});
                });

                return $http.post(filterUrl, query.toJSON());
            };

            return resource;
        }
    ]
);