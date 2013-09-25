angular.module('bawApp.paths', [])

/**
 * This module contains static paths that are stored centrally for easy configuration.
 * App dependent.
 *
 * At least the root properties will need to be changed when the app is deployed.
 * TODO: convert to template and let grunt do the hard work!
 */

    .constant("paths", (function () {

        var paths = {
            api: {
                root: "staging.ecosounds.org",
                routes: {
                    project: "/projects/{{projectId}}",
                    site: "/projects/{{projectId}}/sites/{{siteID}}",
                    security: {
                        ping: "/security/ping"
                    }
                }
            },
            site: {
                root: "localhost:8080/",
                files: {
                    error404: 'error/error_404.tpl.html',
                    home: 'home/home.tpl.html',
                    listen: 'listen/listen.tpl.html',
                    annotationViewer: 'annotationViewer/annotationViewer.tpl.html'
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
    );