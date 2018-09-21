angular
    .module("bawApp.services.progressEvent", [])
    .factory(
        "ProgressEvent",
        [
            "$resource",
            "$http",
            "bawResource",
            "$url",
            "conf.paths",
            "baw.models.progressEvent",
            function ($resource, $http, bawResource, $url, paths, ProgressEventModel) {

                var resource = bawResource(
                    paths.api.routes.progressEvent.listAbsolute,
                    {},
                    {});

                resource.createProgressEvent = function createProgressEvent(dataset_item_id, activity) {
                    return this.save(
                        {},
                        {"progress_event": {"dataset_item_id": dataset_item_id, "activity": activity}},
                        function success (x) {
                            console.log("success (createProgressEvent)", x);
                        },
                        function error (x) {
                            console.log("error (createProgressEvent)", x);
                        }
                    );
                };

                resource.progressEvents = function getProgressEvents(pageNum) {
                    var url = $url.formatUri(paths.api.routes.progressEvents.listAbsolute, {page: pageNum});
                    return $http.get(url).then(x => {
                        return ProgressEventModel.makeFromApi(x);
                    });
                };

                resource.progressEvent = function getProgressEvent(progressEventId) {
                    var url = $url.formatUri(paths.api.routes.progressEvent.showAbsolute, {progressEventId: progressEventId});
                    return $http.get(url).then(x => ProgressEventModel.makeFromApi(x));
                };

                return resource;
            }
        ]
    );