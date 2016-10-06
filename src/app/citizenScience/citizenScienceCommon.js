/**
 * functionality shared by citizen science projects
 */

var citizenScienceCommon = angular.module("bawApp.citizenScience.common", []);

citizenScienceCommon.factory("CitizenScienceCommon", [
        "$rootScope",
        "UserProfile",
        "UserProfileEvents",
        function CitizenScienceCommon($rootScope,
                                     UserProfile,
                                     UserProfileEvents) {

            var self = this;

            self.sheets_api_url = "http://localhost:8081";

            self.audioElement = {
                volume: 1,
                muted: false,
                autoPlay: true,
                position: 0
            };

            self.username = null;

            // bind user profile
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

            return {
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
                labelArrayToObject: function (arr) {
                    var labelObject = {};
                    arr.forEach(function (label) {
                        labelObject[label] = label;
                    });
                    return labelObject;
                },
                /**
                 * Encode the array of labels as a comma separated list or
                 * if there are no labels, "0"
                 * @param labels array
                 * @returns String
                 */
                labelsAsString: function (labels) {
                    return (labels.length > 0) ? labels.join(",") : "0";
                }

            };

        }]);



