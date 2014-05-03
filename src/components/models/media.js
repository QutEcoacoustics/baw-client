var baw = window.baw = window.baw || {};

baw.Media = (function () {

    var module = function Media(resource) {

        if (!(this instanceof Media)) {
            throw new Error("Constructor called as a function");
        }

        if (!angular.isObject(resource)) {
            throw "Media must be constructed with a valid resource.";
        }

        angular.extend(this, resource);

        // additionally do a check on the sample rate
        // the sample rate is used in the unit calculations.
        // it must be exposed and must be consistent for all sub-resources.
        var sampleRate = null;
        var sampleRateChecker = function (value, key) {
            if (sampleRate === null) {
                sampleRate = value.sampleRate;
            }
            else {
                if (value.sampleRate !== sampleRate) {
                    throw "The sample rates are not consistent for the media.json request. At the current time all sub-resources returned must be equal!";
                }
            }
        };

        angular.forEach(resource.availableAudioFormats, sampleRateChecker);
        angular.forEach(resource.availableImageFormats, sampleRateChecker);

        if (angular.isNumber(sampleRate)) {
            resource.sampleRate = sampleRate;
        }
        else {
            throw "The provided sample rate for the Media json must be a number!";
        }

    };

    module.make = function (arg) {
        return new baw.Media(arg);
    };

    return module;
})();