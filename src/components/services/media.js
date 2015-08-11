angular
    .module("bawApp.services.media", [])
    .factory(
    "Media",
    [
        "$resource", "bawResource", "conf.paths",
        function ($resource, bawResource, paths) {

            // create resource for rest requests to media api
            var mediaResource = $resource(bawResource.uriConvert(paths.api.routes.media.showAbsolute),
                                          {
                                              recordingId: "@recordingId",
                                              format: "@format"
                                          });

            // this is a read only service, remove unnecessary methods
            // keep GET
            delete  mediaResource.save;
            delete  mediaResource.query;
            delete  mediaResource.remove;
            delete  mediaResource.delete;

            return mediaResource;
        }
    ]
);