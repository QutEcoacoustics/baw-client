angular.module("baw.models.media", []).factory("baw.models.Media", ["conf.paths", function(paths) {

    function Media(resource) {
        if (!(this instanceof Media)) {
            throw new Error("Constructor called as a function");
        }

        if (!angular.isObject(resource)) {
            throw "Media must be constructed with a valid resource.";
        }

        angular.extend(this, resource);

        // convert the datetime
        this.recording.recordedDate = new Date(this.recording.recordedDate);

        // alias common parameters
        this.startOffset = this.commonParameters.startOffset;
        this.endOffset = this.commonParameters.endOffset;
        this.recordedDate = this.recording.recordedDate;
        this.id = this.recording.id;
        this.durationSeconds = this.recording.durationSeconds;
        if (angular.isNumber(resource.commonParameters.sampleRate)) {
            this.sampleRate = resource.commonParameters.sampleRate;
        }
        else {
            throw "The provided sample rate for the Media json must be a number!";
        }


        /**
         * Change relative image and audio urls into absolute urls
         * @param {Media=} mediaItemToFix
         */
        this.formatPaths = function formatPaths(mediaItemToFix) {
            var mediaItem = mediaItemToFix || this;
            var imgKeys = Object.keys(mediaItem.available.image);
            if (imgKeys.length > 1) {
                throw "don't know how to handle more than one image format!";
            }

            var imageKey = imgKeys[0];
            var imageFormat = mediaItem.available.image[imageKey];
            mediaItem.available.image[imageKey].url = paths.joinFragments(paths.api.root, imageFormat.url);
            mediaItem.spectrogram = imageFormat;

            // make the order explicit (ng-repeat alphabetizes the order >:-|
            mediaItem.available.audioOrder = [];
            angular.forEach(mediaItem.available.audio, function (value, key) {
                // just update the url so it is an absolute uri
                this[key].url = paths.joinFragments(paths.api.root, value.url);

                mediaItem.available.audioOrder.push(key);

            }, mediaItem.available.audio);
        };

        this.formatPaths();
    }

    Media.make = function(arg) {
        return new Media(arg);
    };

    return Media;
}]);
