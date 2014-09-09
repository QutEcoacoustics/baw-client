var bawss = bawss || angular.module("bawApp.services", ['bawApp.services.resource', 'bawApp.configuration']);


bawss.factory('Bookmark', [
    'bawResource',
    'conf.paths',
    'conf.constants',
    'UserProfile',
    '$q',
    function (bawResource, paths, constants, UserProfile, $q) {
        var bc = constants.bookmark;

        // valid query options: category
        // required parameters: userId
        // optional parameters: bookmarkId

        // at the moment we only support bookmark modification for users (not for recordings)
        var resource = bawResource(paths.api.routes.bookmark.showAbsolute, {});

        // retrieve or set the playback bookmark
        resource.applicationBookmarks = {};
        function getApplicationBookmarks(userProfile) {
            console.info("User profile hook success, retrieving app bookmarks", arguments);
            var deferred = $q.defer();

            resource.query({
                    category: bc.appCategory,
                    userId: userProfile.id
                },
                function appBookmarksQuerySuccess(values, headers) {
                    console.info("Application bookmarks received", values);

                    // transform into associative hash
                    values.forEach(function (value, index) {
                        resource.applicationBookmarks[value.name] = value;
                    });

                    deferred.resolve(values);
                },
                function appBookmarksQueryFailure() {
                    console.error("Retrieving application bookmarks failed");

                    deferred.reject();
                });

            return deferred.promise;
        }

        resource.applicationBookmarksPromise = UserProfile.get.then(
            getApplicationBookmarks,
            function () {
                console.error("user profile hook failure", arguments);
            });


        resource.savePlaybackPosition = function savePlaybackPosition(recordingId, offset) {
            var bookmark = resource.applicationBookmarks[bc.lastPlaybackPositionName];
            if (bookmark) {
                // update
                bookmark.offsetSeconds = offset;
                bookmark.audioRecordingId = recordingId;

            }
            else {
                // create
                bookmark = {
                    name: bc.lastPlaybackPositionName,
                    category: bc.appCategory,
                    offsetSeconds: offset,
                    audioRecordingId: recordingId
                };


            }
        };


        return  resource;
    }]);