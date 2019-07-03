/**
 * Misc functionality shared by citizen science controllers.
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
                                  UserProfileEvents) {

        var self = this;

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


        self.functions = {

            getAudioModel: function () {
                return self.audioElementModel;
            },

        };

        return self.functions;

    }]);