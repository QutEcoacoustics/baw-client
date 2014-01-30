var baw = window.baw = window.baw || {};


baw.UserProfile = (function () {

    function UserProfile(profile, defaultProfile) {

        if (!(this instanceof UserProfile)) {
            throw new Error("Constructor called as a function");
        }


        if (!profile) {
            profile = defaultProfile;
        }

        if (!defaultProfile) {
            throw new Error("A default profile must be supplied");
        }

        // make read only properties for all profile props returned
        var props = Object.keys(profile)
            .reduce(function (state, current, index, array) {
                state[current] = {
                    value: profile[current],
                    writeable: false,
                    enumerable: true,
                    configurable: false
                };
                return state;
            }, {});
        Object.defineProperties(this, props);

        // now create persistence settings logic
        var merged = angular.extend(defaultProfile.preferences, this.preferences);
        for (var key in merged) {
            if (!merged.hasOwnProperty(key)) {
                return;
            }

            this.preferences[key] = merged[key];
        }
    }

    return UserProfile;
})();