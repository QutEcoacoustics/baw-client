angular.module('bawApp.configuration', [])

/**
 * This module contains static paths that are stored centrally for easy configuration.
 * App dependent.
 *
 * At least the root properties will need to be changed when the app is deployed.
 * TODO: convert to template and let grunt do the hard work!
 */

    .constant("conf.paths", (function () {

        var paths = {
            api: {
                root: "http://staging.ecosounds.org",
                routes: {
                    project: "/projects/{{projectId}}",
                    site: "/projects/{{projectId}}/sites/{{siteId}}",
                    audioRecording: {
                        listShort: "/audio_recordings/{{recordingId}}",
                        show: "/audio_recordings/{{recordingId}}",
                        list: "/audio_recordings/"
                        },
                    audioEvent: {
                        list: "/audio_recordings/{{recordingId}}/audio_events",
                        show: "/audio_recordings/{{recordingId}}/audio_events/{{audioEventId}}",
                        csv : "/audio_events/download."
                    },
                    tagging: {
                        list: "/projects/{{projectId}}/sites/{{siteId}}/audio_recordings/{{recordingId}}/audio_events/{{audioEventId}}/taggings",
                        show: "/projects/{{projectId}}/sites/{{siteId}}/audio_recordings/{{recordingId}}/audio_events/{{audioEventId}}/taggings/{{taggingsId}}"
                    },
                    tag: {
                      list: '/tags/',
                      show: '/tags/{{tagId}}'
                    },
                    media: {
                        show: "/audio_recordings/{{recordingId}}/media/{{type}}.{{format}}"
                    },
                    security: {
                        ping: "/security/sign_in"
                    }
                }
            },
            site: {
                root: "localhost:8080",
                files: {
                    error404: '/error/error_404.tpl.html',
                    home: '/home/home.tpl.html',
                    listen: '/listen/listen.tpl.html',
                    annotationViewer: '/annotationViewer/annotationViewer.tpl.html'
                },
                ngRoutes :{
                    listen: "/listen/{{recordingId}}"
                }
            }
        };

        // add helper paths
        function recursivePath(source, root) {
            for (var key in source) {
                if (!source.hasOwnProperty(key)) {
                    continue;
                }

                if (angular.isObject(source[key])) {
                    recursivePath(source[key], root);
                }
                else {
                    source[key + 'Absolute'] = root + source[key];
                }
            }
        }

        recursivePath(paths.api.routes, paths.api.root);
        recursivePath(paths.site.files, paths.site.root);
        return paths;
    })()
    )
    .constant("conf.constants", {
        listen: {
            chunkDurationSeconds: 30.0
        }
    });