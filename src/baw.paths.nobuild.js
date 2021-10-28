module.exports = function (environment) {
    var paths = {
        "api": {
            "root": environment.apiRoot,
            "routes": {
                "project": {
                    "list": "/projects/",
                    "show": "/projects/{projectId}",
                    "filter": "/projects/filter"
                },
                "site": {
                    "list": "projects/{projectId}/sites/",
                    "flattened": "/sites/{siteId}",
                    "nested": "/projects/{projectId}/sites/{siteId}",
                    "filter": "/sites/filter"
                },
                "audioRecording": {
                    "listShort": "/audio_recordings/{recordingId}",
                    "show": "/audio_recordings/{recordingId}",
                    "list": "/audio_recordings/",
                    "filter": "/audio_recordings/filter"
                },
                "audioEvent": {
                    "list": "/audio_recordings/{recordingId}/audio_events",
                    "show": "/audio_recordings/{recordingId}/audio_events/{audioEventId}",
                    "filter": "/audio_events/filter",
                    "csv": "/audio_recordings/{recordingId}/audio_events/download.{format}"
                },
                "tagging": {
                    "list": "/audio_recordings/{recordingId}/audio_events/{audioEventId}/taggings",
                    "show": "/audio_recordings/{recordingId}/audio_events/{audioEventId}/taggings/{taggingId}"
                },
                "tag": {
                    "list": "/tags/",
                    "show": "/tags/{tagId}",
                    "filter": "/tags/filter"
                },
                "media": {
                    "show": "/audio_recordings/{recordingId}/media.{format}"
                },
                "security": {
                    "signOut": "/security/user",
                    "ping": "/security/user",
                    "signIn": "/security/user"
                },
                "user": {
                    "profile": "/my_account",
                    "settings": "/my_account/prefs",
                    "filter": "/user_accounts/filter",
                    "show": "/user_accounts/{userId}"
                },
                "audioEventComment": {
                    "show": "/audio_events/{audioEventId}/comments/{audioEventCommentId}"
                },
                "bookmark": {
                    "show": "/bookmarks/{bookmarkId}"
                },
                "analysisResults": {
                    "system": "/analysis_jobs/system/results/{recordingId}",
                    "jobPrefix": "/analysis_jobs/{analysisJobId}/results/",
                    "jobWithPath": "/analysis_jobs/{analysisJobId}/results{path}"
                },
                "analysisJobs": {
                    "list": "/analysis_jobs",
                    "show": "/analysis_jobs/{analysisJobId}",
                    "filter": "/analysis_jobs/filter",
                },
                "scripts": {
                    "list": "/scripts",
                    "show": "/scripts/{scriptId}"
                },
                "savedSearches": {
                    "list": "/saved_searches",
                    "show": "/saved_searches/{savedSearchId}"
                },
                "datasetItem": {
                    "list": "/datasets/{datasetId}/items",
                    "show": "/datasets/{datasetId}/items/{datasetItemId}",
                    "todo": "/datasets/{datasetId}/dataset_items/next_for_me"
                },
                "progressEvent": {
                    "list": "/progress_events",
                    "show": "/progress_events/{progressEventId}",
                    "createByDatasetItemAttributes": "datasets/{datasetId}/progress_events/audio_recordings/{audioRecordingId}/start/{startTimeSeconds}/end/{endTimeSeconds}"
                },
                "question": {
                    "list": "/studies/{studyId}/questions",
                    "show": "/questions/{questionId}"
                },
                "questionResponse": {
                    "list": "/studies/{studyId}/responses",
                    "show": "/responses/{responseId}",
                    "create": "/responses"
                },
                "study": {
                    "list": "/studies",
                    "show": "/studies/{studyId}",
                    "filter": "/studies/filter"
                },
            },
            "links": {
                "projects": "/projects",
                "home": "/",
                "project": "/projects/{projectId}",
                "site": "/projects/{projectId}/sites/{siteId}",
                "userAccounts": "/user_accounts/{userId}",
                "myAnnotations": "user_accounts/{userId}/audio_events",
                "websiteStatus": "/website_status",
                "contactUs": "/about/contact_us",
                "disclaimers": "/about/disclaimers",
                "credits": "/about/credits",
                "ethicsStatement": "/about/ethics",
                "login": "/errors/unauthorized",
                "loginActual": "/my_account/sign_in",
                "logout": "/my_account/sign_out",
                "register": "/my_account/sign_up",
                "admin": "/admin",
                "myAccount": "/my_account",
                "dataUpload": "/data_upload",
                "dataRequest": "/data_request",
                "bugReport": "/bug_report"
            }
        },
        "parent": {
            "root": environment.parentRoot,
            "dir": environment.parentDir
        },
        "site": {
            "root": environment.siteRoot,
            // The following intentionally are not prefixed with a '/'
            // static files
            "files": {
                "error404": "error/error404.tpl.html",
                "home": "home/home.tpl.html",
                "login": {
                    "loginWidget": "login/widget/loginWidget.tpl.html"
                },
                "listen": "listen/listen.tpl.html",
                "annotationViewer": "annotationViewer/annotationViewer.tpl.html",
                "positionLine": "annotationViewer/positionLine.tpl.html",
                "gridLines": "annotationViewer/gridLines/gridLines.tpl.html",
                "positionLine": "annotationViewer/positionLine.tpl.html",
                "annotationComments": "annotationLibrary/comments/comments.tpl.html",
                "library": {
                    "list": "annotationLibrary/annotationLibrary.tpl.html",
                    "item": "annotationLibrary/libraryItem.tpl.html"
                },
                "navigation": {
                    "crumbs": "navigation/navigation.tpl.html",
                    "left": "navigation/leftNavBar.tpl.html",
                    "right": "navigation/rightNavBar.tpl.html"
                },
                "birdWalk": {
                    "list": "birdWalks/birdWalks.tpl.html",
                    "detail": "birdWalks/birdWalk.tpl.html",
                    "spec": "assets/bird_walk/bird_walk_spec.json",
                    "stats": "assets/bird_walk/bird_walk_stats.json",
                    "images": "assets/bird_walk/images/"
                },
                "recordings": {
                    "recentRecordings": "recordings/recentRecordings/recentRecordings.tpl.html"
                },
                "demo": {
                    "d3": "demo/d3TestPage.tpl.html",
                    "rendering": "demo/rendering.tpl.html",
                    "bdCloud2014": "demo/BDCloud2014Demo.tpl.html"
                },
                "d3Bindings": {
                    "eventDistribution": {
                        "distributionVisualisation": "d3Bindings/eventDistribution/distributionVisualisation.tpl.html"
                    }
                },
                "visualize": "visualize/visualize.tpl.html",
                "jobs": {
                    details: "jobs/details/jobDetails.tpl.html",
                    list: "jobs/list/jobsList.tpl.html",
                    "new": "jobs/new/jobNew.tpl.html"
                },
                "analysisResults": {
                    "fileList": "analysisResults/fileList/fileList.tpl.html"
                },
                "users": {
                    "userTile": "users/userTile.tpl.html"
                },
                "savedSearches": {
                    "new": "savedSearches/widgets/newSavedSearch.tpl.html",
                    "list": "savedSearches/widgets/listSavedSearches.tpl.html",
                    "show": "savedSearches/widgets/showSavedSearch.tpl.html"
                },
                "scripts": {
                    "show": "scripts/widgets/showScript.tpl.html"
                }
            },
            // routes used by angular
            "ngRoutes": {
                "recentRecordings": "/listen",
                "listen": "/listen/{recordingId}",
                "listenWithStartFast": ["/listen/", "?start="],
                "library": "/library",
                "libraryItem": "/library/{recordingId}/audio_events/{audioEventId}",
                "visualize": "/visualize",
                "citizenScience": {
                    "aboutStudy":"/citsci/{studyName}",
                    "listenId":"/citsci/{studyName}/listen/{sampleNum}",
                    "listen":"/citsci/{studyName}/listen",
                    "responses": "/citsci/{studyName}/responses"
                },
                "demo": {
                    "d3": "/demo/d3",
                    "rendering": "/demo/rendering",
                    "bdCloud": "/demo/BDCloud2014"
                },
                analysisJobs: {
                    list: "/audio_analysis",
                    "new": "/audio_analysis/new",
                    details: "/audio_analysis/{analysisJobId}",
                    analysisResults: "/audio_analysis/{analysisJobId}/results:path*?"
                }
            },
            // general links for use in <a />'s
            "links": {
                analysisJobs: {
                    analysisResults: "/audio_analysis/{analysisJobId}/results",
                    analysisResultsWithPath: "/audio_analysis/{analysisJobId}/results{path}"
                }
            },
            "assets": {
                "users": {
                    "defaultImage": "assets/img/user_spanhalf.png"
                },
                "citizenScience": {
                    "backgrounds": {
                        "files": "/system/citizen_science/backgrounds/",
                        "lookup": "/system/citizen_science/samples/images.json"
                    },
                    "labelImages": "/system/citizen_science/labels/images/",
                    "landing": "/system/citizen_science/landing/"
                }
            }
        }
    };

    /**
     * Joins path fragments together.
     * @param {...[string]} fragments
     * @returns {*}
     */
    function joinPathFragments() {
        var fragments = Array.prototype.slice.call(arguments, 0);

        if (fragments.length === 0) {
            return undefined;
        }
        else if (fragments.length === 1) {
            return fragments[0];
        }
        else {
            var firstFragment = fragments[0];

            if (firstFragment.slice(-1) === "/") {
                firstFragment = firstFragment.slice(0, -1);
            }

            var path = [firstFragment],
                wasAnyArray = false;

            function processFragment(stringFragment, isLast) {
                if ((typeof stringFragment) !== "string") {
                    throw "joinPathFragments: Path fragment " + stringFragment + " is not a string";
                }

                var hasFirst = stringFragment[0] === "/";
                var hasLast = (stringFragment.slice(-1))[0] === "/";

                if (!hasFirst) {
                    stringFragment = "/" + stringFragment;
                }

                if (hasLast && !isLast) {
                    stringFragment = stringFragment.slice(0, -1);
                }

                return stringFragment;
            }

            for (var i = 1; i < fragments.length; i++) {
                var f = fragments[i];

                var isArray = f instanceof Array;
                if (isArray) {
                    wasAnyArray = true;
                    f.forEach(function (item, index) {
                        path.push(processFragment(item, i === (fragments.length - 1)));
                    });
                }
                else {
                    path.push(processFragment(f, i === (fragments.length - 1)));
                }
            }

            if (wasAnyArray) {
                return path;
            }

            return path.join("");
        }
    }

    function isObject(x) {
        return typeof x === "object" && x !== null && !(x instanceof Array);
    }

    // add helper paths
    function recursivePath(source, root) {
        for (var key in source) {
            if (!source.hasOwnProperty(key)) {
                continue;
            }

            if (isObject(source[key])) {
                recursivePath(source[key], root);
            }
            else {
                source[key + "Absolute"] = joinPathFragments(root, source[key]);
            }
        }
    }

    const parentPath = joinPathFragments(paths.parent.root, paths.parent.dir)

    recursivePath(paths.api.routes, paths.api.root);
    recursivePath(paths.api.links, parentPath);
    recursivePath(paths.site.files, paths.site.root);
    recursivePath(paths.site.ngRoutes, parentPath);
    recursivePath(paths.site.links, parentPath);
    recursivePath(paths.site.assets, joinPathFragments(environment.siteRoot, environment.siteDir));

    return paths;
}
;
