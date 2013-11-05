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
                root: "<%= current.apiRoot %>",
                routes: {
                    project: "/projects/{projectId}",
                    site: "/projects/{projectId}/sites/{siteId}",
                    audioRecording: {
                        listShort: "/audio_recordings/{recordingId}",
                        show: "/audio_recordings/{recordingId}",
                        list: "/audio_recordings/"
                        },
                    audioEvent: {
                        list: "/audio_recordings/{recordingId}/audio_events",
                        show: "/audio_recordings/{recordingId}/audio_events/{audioEventId}",
                        csv : "/audio_events/download."
                    },
                    tagging: {
                        list: "/audio_recordings/{recordingId}/audio_events/{audioEventId}/taggings",
                        show: "/audio_recordings/{recordingId}/audio_events/{audioEventId}/taggings/{taggingsId}"
                    },
                    tag: {
                      list: '/tags/',
                      show: '/tags/{tagId}'
                    },
                    media: {
                        show: "/audio_recordings/{recordingId}/media.{format}"
                    },
                    security: {
                        ping: "/security/sign_in"
                    }
                }
            },
            site: {
                root: "<%= current.siteRoot %>",
                // The following intentionally are not prefixed with a '/'
                files: {
                    error404: 'error/error_404.tpl.html',
                    home: 'home/home.tpl.html',
                    listen: 'listen/listen.tpl.html',
                    annotationViewer: 'annotationViewer/annotationViewer.tpl.html',
                    navigation: 'navigation/navigation.tpl.html',
                    birdWalks: 'birdWalks/birdWalks.tpl.html'
                },
                ngRoutes :{
                    listen: "/listen/{recordingId}/"
                }
            }
        };

        /**
         * Joins path fragments together.
         * @param {...[string]} fragments
         * @returns {*}
         */
        function joinPathFragments(fragments) {
            fragments = Array.prototype.slice.call(arguments, 0);

            if (fragments.length === 0) {
                return undefined;
            }
            else if (fragments.length === 1) {
                return fragments[0];
            }
            else {
                var path = fragments[0];

                if (path.slice(-1) === "/") {
                    path = path.slice(0, -1);
                }

                for (var i = 1; i < fragments.length; i++) {
                    var f = fragments[i];

                    if ((typeof f) !== "string") {
                        throw "Path fragment " + f + " is not a string";
                    }

                    var hasFirst = f[0] === "/";
                    var hasLast = (f.slice(-1))[0] === "/";

                    if (!hasFirst) {
                        f =  "/" + f;
                    }

                    if (hasLast && i !== (fragments.length - 1)) {
                        f = f.slice(0, -1);
                    }

                    path += f;
                }

                return path;
            }
        }

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
                    source[key + 'Absolute'] = joinPathFragments(root, source[key]);
                }
            }
        }

        recursivePath(paths.api.routes, paths.api.root);
        recursivePath(paths.site.files, paths.site.root);
        recursivePath(paths.site.ngRoutes, paths.site.root);

        paths.joinFragments = joinPathFragments;

        return paths;
    })()
    )
    .constant("conf.constants", {
        listen: {
            chunkDurationSeconds: 30.0
        }
    });