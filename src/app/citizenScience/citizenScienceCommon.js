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

        self.useLocalData = true;

        self.sheets_api_url = "http://" + window.location.hostname + ":8081";
        self.local_api_url = "/public/citizen_science";

        /**
         * Default values for audio model, to be updated when UserProfile is loaded
         * @type {Object}
         */
        self.audioElementModel = {
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
            self.audioElementModel.volume = UserProfile.profile.preferences.volume;
            self.audioElementModel.muted = UserProfile.profile.preferences.muted;
            self.audioElementModel.autoPlay = UserProfile.profile.preferences.autoPlay;
        };

        $rootScope.$on(UserProfileEvents.loaded, self.profileLoaded);
        if (UserProfile.profile && UserProfile.profile.preferences) {
            self.profileLoaded(null, UserProfile);
        }

        self.mediaModel = null;


        /**
         * Checks if a tag or array of tags is the same
         * @param tags1 mixed string or array of strings
         * @param tags2 mixed string or array of strings
         */
        self.compareTags = function (tags1, tags2) {

            if (Array.isArray(tags1)) {
                tags1 = tags1.sort().join("");
            }
            if (Array.isArray(tags2)) {
                tags2 = tags2.sort().join("");
            }

            return tags1 === tags2;

        };



        self.apiUrl = function () {
            // convert to array
            var base_url, url;
            if (self.useLocalData) {
                base_url = self.local_api_url;
            } else {
                base_url = self.sheets_api_url;
            }
            var args = Array.prototype.slice.call(arguments);

            url = [base_url].concat(args).join("/");

            if (self.useLocalData) {
                url = url + ".json";
            }

            return url;
        };


        self.functions = {

            getAudioModel: function () {
                return self.audioElementModel;
            },

            /**
             * Constructs a url for the api by concatenating url/arg1/arg2/arg3 etc
             */
            apiUrl: self.apiUrl,

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
                            "samples",
                            $scope.csProject,
                            UserProfile.profile.userName);
                        //TODO: error handling
                        $http.get(url).then(function (response) {
                            //console.log(response.data);
                            var samples = response.data;
                            $scope.samples = samples;
                            //self.initSampleLabels($scope.samples, $scope.labels);
                            //$scope.goToSample(0);
                            $scope.currentSampleNum = 0;
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

            },

            getLabels: function (project) {
                var response = $http.get(self.apiUrl(
                    "labels",
                    project
                ));

                return response.then(function (response) {
                    var labels = [];
                    if (Array.isArray(response.data)) {
                        labels = response.data;
                    }

                    return labels;
                });
            },

            getSettings: function (project) {
                return $http.get(self.apiUrl(
                    "settings",
                    project
                ));
            }

        };

        return self.functions;

    }]);



