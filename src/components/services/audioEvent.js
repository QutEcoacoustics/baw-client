angular
    .module("bawApp.services.audioEvent", [])
    .factory(
    "AudioEvent",
    [
        '$resource', "bawResource", '$url', 'conf.paths',
        function ($resource, bawResource, $url, paths) {
            var baseCsvUri = paths.api.routes.audioEvent.csvAbsolute;

            var csvOptions = {
                format: "csv", // "csv", "xml", "json"
                projectId: null,
                siteId: null,
                recordingId: null,
                startOffset: null,
                endOffset: null

            };
            // TODO: move this to paths conf object

            function makeCsvLink(options) {
                var query = angular.extend(csvOptions, options);
                return $url.formatUri(baseCsvUri, query);
            }

            var resource = bawResource(
                paths.api.routes.audioEvent.showAbsolute,
                {recordingId: '@recordingId', audioEventId: '@audioEventId'},
                {
                    library: {
                        method: 'GET',
                        url: bawResource.uriConvert(paths.api.routes.audioEvent.libraryAbsolute)
                    },
                    query: {
                        method: "GET",
                        isArray: true
                    }
                });
            resource.csvLink = makeCsvLink;

            return resource;
        }
    ]
);