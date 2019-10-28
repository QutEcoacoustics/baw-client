angular
    .module("bawApp.services.media", [])
    .factory(
    "Media",
    [
        "$resource", "bawResource", "conf.paths", "$http", "$url",
        function ($resource, bawResource, paths, $http, $url) {

            // create resource for rest requests to media api
            var mediaResource = $resource(bawResource.uriConvert(paths.api.routes.media.showAbsolute),
                                          {
                                              recordingId: "@recordingId",
                                              format: "@format"
                                          });

            mediaResource.getFromHost = function (mediaParameters, host) {

                var mediaUrl = bawResource.crossDomainUrlAbsolute("media", "show", host);
                return $http.get($url.formatUriServer(mediaUrl, mediaParameters));

            };

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