/**
 * functionality shared by citizen science projects
 */

var citizenScienceCommon = angular.module("bawApp.citizenScience.common", []);

citizenScienceCommon.factory("CitizenScienceCommon", [
    "$rootScope",
    "UserProfile",
    "UserProfileEvents",
    "$http",
    "Media",
    "baw.models.Media",
    function CitizenScienceCommon($rootScope,
                                  UserProfile,
                                  UserProfileEvents,
                                  $http,
                                  Media,
                                  MediaModel) {

        var self = this;

        self.sheets_api_url = "http://"+window.location.hostname+":8081";

        /**
         * Default values for audio model, to be updated when UserProfile is loaded
         * @type {Object}
         */
        self.audioElement = {
            volume: null,
            muted: null,
            autoPlay: null,
            position: 0
        };

        self.username = null;

        /**
         * Callback funtion to apply user playback settings after user profile is loaded
         * @param event
         * @param UserProfile
         */
        self.profileLoaded = function updateProfileSettings(event, UserProfile) {
            self.audioElement.volume = UserProfile.profile.preferences.volume;
            self.audioElement.muted = UserProfile.profile.preferences.muted;
            self.audioElement.autoPlay = UserProfile.profile.preferences.autoPlay;
        };
        $rootScope.$on(UserProfileEvents.loaded, self.profileLoaded);
        if (UserProfile.profile && UserProfile.profile.preferences) {
            self.profileLoaded(null, UserProfile);
        }

        self.mediaModel = null;

        self.functions = {

            getAudioModel: function () {
                return self.audioElement;
            },

            /**
             * Constructs a url for the api by concatenating url/arg1/arg2/arg3 etc
             */
            apiUrl: function () {
                // convert to array
                var args = Array.prototype.slice.call(arguments);
                return [self.sheets_api_url].concat(args).join("/");
            },

            /**
             * Converts an array of strings to an object where each key is the same as the val
             * Used so that a list of labels returned from the dataset can be converted to the same
             * format as the hardcoded labels (where the key might be different from the val)
             * @TODO: remove this as labels now use a different format
             * @param arr Array
             * @returns {{}}
             */
            labelArrayToObject: function (arr) {
                var labelObject = {};
                arr.forEach(function (label) {
                    labelObject[label] = label;
                });
                return labelObject;
            },

            /**
             * Encode the array of labels as json
             * @TODO: rename this to tags. Each label can have multiple tags.
             * so this will be 2d array, outer array is labels and each label is an array of tags.
             * @param labels array
             * @returns String
             */
            labelsAsString: function (labels) {
                return JSON.stringify(labels);
            },

            /**
             * Returns a function that retrieves the samples for the user and the project
             * @param $scope
             * @returns {function}
             */
            bindGetSamples: function ($scope) {
                var getSamples = function () {
                    if ($scope.samples.length === 0) {
                        var url = self.functions.apiUrl(
                            "userSamples",
                            $scope.csProject,
                            UserProfile.profile.userName);
                        //TODO: error handling
                        $http.get(url).then(function (response) {
                            //console.log(response.data);
                            var samples = response.data;
                            $scope.samples = samples;
                            $scope.goToSample(0);
                        });
                    }
                };
                UserProfile.get.then(getSamples);
                return getSamples;
            },
            /**
             * Returns a funciton that sets the media member of the scope to the
             * specified recording segment. The watcher will then actually load it to the dom
             * @param recordingId string
             * @param startOffset float
             * @param duration float
             */
            bindShowAudio: function ($scope) {

                var showAudio = function (recordingId, startOffset, duration) {

                    var mediaParams = {
                        recordingId: recordingId,
                        startOffset: startOffset,
                        endOffset: startOffset + duration,
                        format: "json"
                    };

                    Media.get(
                        mediaParams,
                        function (mediaValue) {
                            $scope.media = new MediaModel(mediaValue.data);
                        },
                        function () {
                            console.log("fail");
                        } // failure
                    );

                    // do not block, do not wait for Media requests to finish
                    return;

                };

                return showAudio;


            }


        };

        return self.functions;

    }]);



