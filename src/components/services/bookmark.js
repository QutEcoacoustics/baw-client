var bawss = bawss || angular.module("bawApp.services", ['bawApp.services.resource', 'bawApp.configuration']);


bawss.factory('Bookmark', [
    'bawResource',
    'conf.paths',
    'conf.constants',
    'UserProfile',
    '$q',
    function (bawResource, paths, constants, UserProfile, $q) {
        var bc = constants.bookmark;

<<<<<<< HEAD
        var resource = bawResource(
            paths.api.routes.bookmark.showAbsolute,
            {},
            {query:{method: "GET", isArray: false}});
=======
        // valid query options: category
        // required parameters: userId
        // optional parameters: bookmarkId

        // at the moment we only support bookmark modification for users (not for recordings)
        var resource = bawResource(paths.api.routes.bookmark.showAbsolute, {});
>>>>>>> c1598ec2106c3ea77b28aac985caadebf8fcb5ac

        // retrieve or set the playback bookmark
        resource.applicationBookmarks = {};
        function getApplicationBookmarks(userProfile) {
            console.info("User profile hook success, retrieving app bookmarks", arguments);
            var deferred = $q.defer();

<<<<<<< HEAD
            // todo: replace with queryBuilder
            resource.query({
                               filter_category: bc.appCategory,
                               filter_userId: userProfile.id
                           },
                           function appBookmarksQuerySuccess(values, headers) {
                               console.info("Application bookmarks received", values);

                               // transform into associative hash
                               values.data.forEach(function (value, index) {
                                   if (resource.applicationBookmarks[value.name]) {
                                       console.error("Bookmark array->object has duplicate keys");
                                   }

                                   resource.applicationBookmarks[value.name] = value;
                               });

                               deferred.resolve(values);
                           },
                           function appBookmarksQueryFailure() {
                               console.error("Retrieving application bookmarks failed");

                               deferred.reject();
                           });
=======
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
>>>>>>> c1598ec2106c3ea77b28aac985caadebf8fcb5ac

            return deferred.promise;
        }

        resource.applicationBookmarksPromise = UserProfile.get.then(
            getApplicationBookmarks,
            function () {
                console.error("user profile hook failure", arguments);
            });


        resource.savePlaybackPosition = function savePlaybackPosition(recordingId, offset) {
<<<<<<< HEAD
            function bookmarkSaveSuccess(value, headers) {
                console.log("Bookmark save success");
                var bookmark = value.data;
                resource.applicationBookmarks[bookmark.name] = bookmark;
            }

            function bookmarkSaveError() {
                console.error("Bookmark create/save failed", arguments);
            }

=======
>>>>>>> c1598ec2106c3ea77b28aac985caadebf8fcb5ac
            var bookmark = resource.applicationBookmarks[bc.lastPlaybackPositionName];
            if (bookmark) {
                // update
                bookmark.offsetSeconds = offset;
                bookmark.audioRecordingId = recordingId;
<<<<<<< HEAD
                console.debug("Updating bookmark", bookmark);

                resource
                    .update({bookmarkId: bookmark.id}, bookmark)
                    .$promise
                    .then(bookmarkSaveSuccess, bookmarkSaveError);
=======

>>>>>>> c1598ec2106c3ea77b28aac985caadebf8fcb5ac
            }
            else {
                // create
                bookmark = {
                    name: bc.lastPlaybackPositionName,
                    category: bc.appCategory,
                    offsetSeconds: offset,
                    audioRecordingId: recordingId
                };
<<<<<<< HEAD
                console.debug("Creating bookmark", bookmark);

                resource
                    .save({}, bookmark)
                    .$promise
                    .then(bookmarkSaveSuccess, bookmarkSaveError);
=======


>>>>>>> c1598ec2106c3ea77b28aac985caadebf8fcb5ac
            }
        };


<<<<<<< HEAD
        return resource;
=======
        return  resource;
>>>>>>> c1598ec2106c3ea77b28aac985caadebf8fcb5ac
    }]);