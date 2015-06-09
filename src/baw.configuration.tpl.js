angular.module('bawApp.configuration', ['url'])

/**
 * This module contains static paths that are stored centrally for easy configuration.
 * App dependent.
 *
 * The root properties are changed when the app is built with grunt.
 */

    .constant("conf.paths", (function () {

        var paths = {
            api: {
                root: "<%= current.apiRoot %>",
                routes: {
                    project: {
                        list: "/projects/",
                        show: "/projects/{projectId}",
                        filter: "/projects/filter"
                    },
                    site: {
                        list: "projects/{projectId}/sites/",
                        flattened: "/sites/{siteId}",
                        nested: "/projects/{projectId}/sites/{siteId}",
                        filter: "/sites/filter"
                    },
                    audioRecording: {
                        listShort: "/audio_recordings/{recordingId}",
                        show: "/audio_recordings/{recordingId}",
                        list: "/audio_recordings/",
                        filter: "/audio_recordings/filter"
                    },
                    audioEvent: {
                        list: "/audio_recordings/{recordingId}/audio_events",
                        show: "/audio_recordings/{recordingId}/audio_events/{audioEventId}",
                        csv: "/audio_recordings/{recordingId}/audio_events/download.{format}",
                        library: "/audio_events/library/paged"
                    },
                    tagging: {
                        list: "/audio_recordings/{recordingId}/audio_events/{audioEventId}/taggings",
                        show: "/audio_recordings/{recordingId}/audio_events/{audioEventId}/taggings/{taggingId}"
                    },
                    tag: {
                        list: '/tags/',
                        show: '/tags/{tagId}'
                    },
                    media: {
                        show: "/audio_recordings/{recordingId}/media.{format}"
                    },
                    security: {
                        signOut: "/security/user",
                        ping: "/security/user",
                        signIn: "/security/user"
                    },
                    user: {
                        profile: "/my_account",
                        settings: "/my_account/prefs"
                    },
                    audioEventComment: {
                        show: '/audio_events/{audioEventId}/comments/{audioEventCommentId}'
                    },
                    bookmark: {
                        show: "/bookmarks/{bookmarkId}"
                    },
                    analysisResults: {
                        system: "/audio_recordings/{recordingId}/analysis.{format}"
                    }
                },
                links: {
                    projects: '/projects',
                    home: '/',
                    project: '/projects/{projectId}',
                    site: '/projects/{projectId}/sites/{siteId}',
                    userAccounts: '/user_accounts/{userId}',
                    websiteStatus: '/website_status',
                    contactUs: '/contact_us',
                    disclaimers: '/disclaimers',
                    credits: '/credits',
                    ethicsStatement: '/ethics_statement',
                    login: "/errors/unauthorized"

                }
            },
            site: {
                root: "<%= current.siteRoot %>",
                // The following intentionally are not prefixed with a '/'
                // static files
                files: {
                    error404: 'error/error_404.tpl.html',
                    home: 'home/home.tpl.html',
                    listen: 'listen/listen.tpl.html',
                    annotationViewer: 'annotationViewer/annotationViewer.tpl.html',
                    gridLines: 'annotationViewer/gridLines/gridLines.tpl.html',
                    annotationComments: 'annotationLibrary/comments/comments.tpl.html',
                    library: {
                        list: 'annotationLibrary/annotationLibrary.tpl.html',
                        item: 'annotationLibrary/annotationItem.tpl.html'
                    },
                    navigation: 'navigation/navigation.tpl.html',
                    birdWalk: {
                        list: 'birdWalks/birdWalks.tpl.html',
                        detail: 'birdWalks/birdWalk.tpl.html',
                        spec: 'assets/bird_walk/bird_walk_spec.json',
                        stats: 'assets/bird_walk/bird_walk_stats.json',
                        images: 'assets/bird_walk/images/'
                    },
                    recordings: {
                        recentRecordings: 'recordings/recentRecordings/recentRecordings.tpl.html'
                    },
                    demo: {
                        d3: 'demo/d3TestPage.tpl.html',
                        rendering: 'demo/rendering.tpl.html',
                        bdCloud2014: 'demo/BDCloud2014Demo.tpl.html'
                    },
                    d3Bindings: {
                        eventDistribution: {
                            distributionVisualisation: "d3Bindings/eventDistribution/distributionVisualisation.tpl.html"
                        }
                    },
                    visualize: "visualize/visualize.tpl.html"
                },
                // routes used by angular
                ngRoutes: {
                    recentRecordings: "/listen",
                    listen: "/listen/{recordingId}",
                    library: "/library",
                    libraryItem: "/library/{recordingId}/audio_events/{audioEventId}",
                    visualize: "/visualize",
                    demo: {
                        d3: "/demo/d3",
                        rendering: "/demo/rendering",
                        bdCloud: "/demo/BDCloud2014"
                    }
                },
                // general links for use in <a />'s
                links: {}
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
                        throw "joinPathFragments: Path fragment " + f + " is not a string";
                    }

                    var hasFirst = f[0] === "/";
                    var hasLast = (f.slice(-1))[0] === "/";

                    if (!hasFirst) {
                        f = "/" + f;
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
        recursivePath(paths.api.links, paths.api.root);
        recursivePath(paths.site.files, paths.site.root);
        recursivePath(paths.site.ngRoutes, paths.api.root);

        paths.joinFragments = joinPathFragments;

        return paths;
    })()
)
    .constant("conf.constants", {
        namespace: "baw-client",
        rails: {
            loginRedirectQsp: "redirect_to"
        },
        localization: {
            dateTimeFormat: "YYYY-MMM-DD HH:mm:ss",
            dateTimeShortFormat: "YYYY-MMM-DD HH:mm",
            dateFormat: "YYYY-MMM-DD"
        },
        listen: {
            chunkDurationSeconds: 30.0,
            minAudioDurationSeconds: 2.0
        },
        unitConverter: {
            precisionSeconds: 9,
            precisionHertz: 6
        },
        defaultProfile: {
            createdAt: null,
            email: null,
            id: null,
            preferences: {
                volume: 1.0,
                muted: false,
                autoPlay: false,
                visualize: {
                    showTemporalContext: true
                }
            },
            userName: "Unknown user"
        },
        annotationLibrary: {
            paddingSeconds: 1.0
        },
        browserSupport: {
            optimum: {
                chrome: 36
            },
            supported: {
                msie: 10,
                firefox: 36,
                chrome: 30,
                safari: 5.1,
                opera: 23,
                ios: 5.1,
                android: 4.0
            },
            baseMessage: "Your current internet browser ({name}, version {version}) is {reason}. <br/> Consider updating or try using <a target='_blank' href='https://www.google.com.au/intl/en_au/chrome/browser/' >Google Chrome</a>.",
            localStorageKey: "browserSupport.checked"
        },
        queryBuilder: {
            defaultPage: 0,
            defaultPageItems: 10,
            defaultSortDirection: "asc"
        },
        bookmark: {
            lastPlaybackPositionName: "Last playback position",
            appCategory: "<<application>>"
        },
        predictiveCache: {

            profiles: {
                "Media cache ahead": function bind($location, paths) {
                    // request additional bits of media based the duration of the original request
                    // do not make requests that would exceed the end of the recording
                    function mediaProgressor(previous, data) {
                        var media = data.responseData.data,
                            duration = media.commonParameters.endOffset - media.commonParameters.startOffset,
                            next = previous + duration,
                            max = media.recording.durationSeconds;

                        if (next >= max) {
                            return;
                        }
                        else {
                            return next;
                        }
                    }

                    function formatMediaUrl(url, counters) {
                        return paths.api.root + url
                            .replace(/start_offset=[\.\d]+/, "start_offset=" + counters[0])
                            .replace(/end_offset=[\.\d]+/, "end_offset=" + counters[1]);
                    }
                    return {
                        name: "Media cache ahead",
                        match: function (url, response) {
                            // match only if on listen page and request is for a media's json
                            if ($location.path().indexOf("/listen") === 0 &&
                                /\/audio_recordings\/[\.\d]+\/media\.json.*/.test(url)) {
                                var so = response.config.params.start_offset;
                                var eo = response.config.params.end_offset;

                                return so !== undefined && eo !== undefined ? [so, eo] : null;
                            }

                            return null;
                        },
                        request: [
                            // spectrogram
                            function (counters, data) {
                               return formatMediaUrl(data.responseData.data.available.image["png"].url, counters);
                            },
                            // mp3
                            function (counters, data) {
                                return formatMediaUrl(data.responseData.data.available.audio["mp3"].url, counters);
                            }
                        ],
                        progression: [
                            mediaProgressor, mediaProgressor
                        ],
                        count: 10,
                        method: "HEAD",
                        progressive: true
                    };
                }
            }
        }
    });