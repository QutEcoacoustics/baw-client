angular
    .module("bawApp.services.taggings", [])
    .factory(
    "Taggings",
    [
        "$resource", "bawResource", "conf.paths",
        function ($resource, bawResource, paths) {
            var resource = bawResource(paths.api.routes.tagging.showAbsolute,
                                       {
                                           recordingId: "@recordingId",
                                           audioEventId: "@audioEventId",
                                           taggingId: "@taggingId"
                                       });

            return resource;
        }]
);