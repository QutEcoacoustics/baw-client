var baw = window.baw = window.baw || {};


baw.UserProfile = (function () {

    /*function makeGetter(key) {
     return function() {
     return this[key];
     };
     }

     function makeSetter(key, service) {
     return function(value) {
     if (value !== this[key]) {
     this[key] = value;
     service.updatePreferences(key, this);
     }
     };
     }*/

    function UserProfile(serviceReference, profile, defaultProfile) {

        if (!(this instanceof UserProfile)) {
            throw new Error("Constructor called as a function");
        }

        var immediateSave = false;
        if (!profile) {
            profile = defaultProfile;
            immediateSave = true;
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

            /*
             Object.defineProperty(this.preferences,  "_" + key, {
             value: merged[key],
             writeable: true,
             enumerable: false,
             configurable: false
             });

             Object.defineProperty(this.preferences, key, {
             get: makeGetter(key),
             set: makeSetter(key, serviceReference),
             configurable: false,
             enumerable: true
             });*/
        }

        if (immediateSave) {

        }

    }

    return UserProfile;
})();