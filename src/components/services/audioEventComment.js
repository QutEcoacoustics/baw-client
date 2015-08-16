angular
    .module("bawApp.services.audioEventComment", [])
    .factory(
    "AudioEventComment",
    [
        "bawResource", "conf.paths",
        function (bawResource, paths) {
            return bawResource(
                paths.api.routes.audioEventComment.showAbsolute,
                {audioEventId: "@audioEventId", audioEventCommentId: "@audioEventCommentId"});
        }
    ]
);