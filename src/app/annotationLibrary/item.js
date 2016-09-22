angular
    .module("bawApp.annotationLibrary.item", [])
    .controller(
    "AnnotationItemCtrl",
    [
        "$scope",
        "$location",
        "$resource",
        "$routeParams",
        "$url",
        "conf.paths",
        "conf.constants",
        "bawApp.unitConverter",
        "moment",
        "lodash",
        "annotationLibraryCommon",
        "AudioEvent",
        "baw.models.AudioEvent",
        "Tag",
        "Media",
        "baw.models.Media",
        "UserProfileEvents",
        "UserProfile",
        "AudioEventComment",
        function ($scope, $location, $resource, $routeParams, $url,
                  paths, constants, unitConverter, moment, _,
                  libraryCommon, AudioEventService, AudioEvent, Tag,
                  MediaService, Media, UserProfileEvents, UserProfile, AudioEventComment) {

            $scope.audioEventCommentsEnabled = true;
            $scope.comments = [];

            UserProfile.get.then(() => {
                $scope.profile = UserProfile.profile;
            });


            var parameters = {
                audioEventId: $routeParams.audioEventId,
                recordingId: $routeParams.recordingId
            };

            // new comment text and errors
            $scope.newComment = {
                // bind to new comment textarea
                text: "",
                errors: []
            };

            $scope.editComment = {
                id: null,
                text: null,
                errors: []
            };



            // HACK: use a filter endpoint because that API is newer
            // (unlike the current resource API which is using the old format).
            ////AudioEventService.get(parameters,
            AudioEventService
                .getAudioEventsByIds([parameters.audioEventId])
                .then(function annotationShowSuccess(response, responseHeaders) {
                    var audioEvents = response.data.data;

                    var annotation = new AudioEvent(audioEvents[0]);

                    var commonData = {
                        annotations: [annotation],
                        annotationIds: new Set([annotation.id]),
                        recordingIds: new Set([annotation.audioRecordingId])
                    };

                    libraryCommon.addCalculatedProperties(annotation);

                    libraryCommon.getTags(commonData);
                    libraryCommon.getSiteMediaAndProject(commonData);
                    libraryCommon.getUsers(commonData);
                    $scope.annotation = annotation;

                            // todo: load these from user preferences
                            $scope.annotation.audioElement = {
                                volume: 1,
                                muted: false,
                                autoPlay: true,
                                position: 0
                            };


                    // comments
                    reloadComments();
                },
                function annotationShowError(httpResponse) {
                    console.error("Failed to load library single item response.", parameters, httpResponse);
                });

            $scope.createFilterUrl = function createFilterUrl(paramObj) {
                return $url.formatUri(paths.site.ngRoutes.libraryAbsolute, paramObj);
            };

            $scope.createCommentLinkUrl = function createCommentLinkUrl(audioEventCommentId) {
                return "/library/" + $routeParams.recordingId + "/audio_events/" +
                    $routeParams.audioEventId + "#" + audioEventCommentId;
            };

            $scope.formatTimeAgo = function formatTimeAgo(date) {
                if (date) {
                    return moment(date).fromNow();
                }
                else {
                    return "unknown";
                }
            };

            $scope.createComment = function createComment() {
                if ($scope.createCommentForm.$valid) {
                    AudioEventComment.save(
                        {audioEventId: $routeParams.audioEventId}, // parameters
                        {comment: $scope.newComment.text}, // post data
                        function createCommentSuccess(value, responseHeaders) {
                            console.log("create success", arguments);
                            $scope.newComment.errors = [];
                            $scope.newComment.text = "";
                            reloadComments();
                        },
                        function createCommentError(httpResponse) {
                            console.log("create failure", arguments);
                            $scope.newComment.errors = httpResponse.data.comment;
                        });
                }
            };

            $scope.deleteComment = function deleteComment(commentText, audioEventCommentId) {
                var isConfirmed = confirm("Are you sure you want to delete this comment? \"" + commentText + "\"");
                if (isConfirmed === true) {
                    AudioEventComment.delete(
                        {
                            audioEventId: $routeParams.audioEventId,
                            audioEventCommentId: audioEventCommentId
                        }, // parameters
                        null, // post data
                        function deleteCommentSuccess(value, responseHeaders) {
                            console.log("delete success", arguments);
                            $scope.newComment.errors = [];
                            $scope.newComment.text = "";
                            reloadComments();
                        },
                        function deleteCommentError(httpResponse) {
                            console.log("delete failure", arguments);
                            $scope.newComment.errors = httpResponse.data.comment;
                        });
                }
            };

            function updateCommentBase(id, body) {
                AudioEventComment.update(
                    // url parameters
                    {
                        audioEventId: $routeParams.audioEventId,
                        audioEventCommentId: id
                    },
                    // body
                    body,
                    function updateCommentSuccess(value, responseHeaders) {
                        console.log("update success", arguments);
                        $scope.editComment.errors = [];
                        $scope.editComment.text = null;
                        $scope.editComment.id = null;
                        reloadComments();
                    },
                    function updateCommentError(httpResponse) {
                        console.log("update failure", arguments);
                        $scope.editComment.errors = httpResponse.data.comment;
                    });
            }

            $scope.updateComment = function updateComment(comment, updateForm) {
                if (updateForm.$valid) {
                    updateCommentBase(comment.id, {
                        comment: comment.comment
                    });
                    comment.editing = false;
                }
            };

            $scope.editComment = function editComment(comment) {
                comment.editing = true;
            };

            $scope.reportComment = function reportComment(comment) {
                comment.flag = "report";
                updateCommentBase(comment.id, {
                    flag: comment.flag
                });

            };

            function reloadComments() {
                // get array of comment for the current audio event
                AudioEventComment.query(
                    {audioEventId: $routeParams.audioEventId},
                    function audioEventCommentSuccess(value, responseHeaders) {
                        // HACK: temporary hack, de-dupe results
                        // https://github.com/QutBioacoustics/baw-server/issues/219
                        $scope.comments = _.uniq(value.data, false, (value) => value.id);

                        $scope.comments.forEach(function (value) {

                        });

                        $scope.audioEventCommentsEnabled = true;
                        $scope.createCommentForm.$setPristine(true);
                    },
                    function audioEventCommentsFailure(response) {
                        $scope.audioEventCommentsEnabled = false;
                        console.warn("Unable to audio event comments, comments disabled");
                    }
                );

            }

        }
    ]
);