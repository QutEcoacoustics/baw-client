angular
    .module("bawApp.models.media", [])
    .factory(
    "baw.models.Media",
    [
        "baw.models.ApiBase",
        "conf.paths",
        "Authenticator",
        "$url",
        "ProgressEvent",
        function (ApiBase, paths, Authenticator, url, ProgressEvent) {

            class Media extends ApiBase {
                constructor(resource, host = null) {
                    super(resource);

                    this.host = host || paths.api.root;

                    // convert the datetime
                    this.recording.recordedDate = new Date(this.recording.recordedDate);

                    // alias common parameters
                    this.startOffset = this.commonParameters.startOffset;
                    this.endOffset = this.commonParameters.endOffset;
                    this.recordedDate = this.recording.recordedDate;
                    this.id = this.recording.id;
                    this.durationSeconds = this.recording.durationSeconds;
                    if (angular.isNumber(this.commonParameters.sampleRate)) {
                        this.sampleRate = this.commonParameters.sampleRate;
                    }
                    else {
                        throw "The provided sample rate for the Media json must be a number!";
                    }

                    this.formatPaths();
                    // record which progress event activities have been sent for this media item
                    this.progressEvents = {};
                }

                /**
                 * Change relative image and audio urls into absolute urls.
                 * Also appends auth tokens onto urls.
                 * @param {Media=} mediaItemToFix
                 */
                formatPaths(mediaItemToFix) {
                    var mediaItem = mediaItemToFix || this;
                    var imgKeys = Object.keys(mediaItem.available.image);
                    if (imgKeys.length > 1) {
                        throw "don't know how to handle more than one image format!";
                    }

                    var imageKey = imgKeys[0];
                    var imageFormat = mediaItem.available.image[imageKey];
                    var root = this.host;
                    var fullUrl = root + imageFormat.url;
                    var params = this.host === paths.api.root ? {userToken: Authenticator.authToken} : {};
                    mediaItem.available.image[imageKey].url = url.formatUriServer(fullUrl, params);

                    mediaItem.spectrogram = imageFormat;

                    // make the order explicit (ng-repeat alphabetizes the order >:-|
                    mediaItem.available.audioOrder = [];
                    angular.forEach(mediaItem.available.audio, function (value, key) {
                        // just update the url so it is an absolute uri
                        var fullUrl = root + value.url;

                        // also add auth token
                        this[key].url = url.formatUriServer(fullUrl, {userToken: Authenticator.authToken});

                        mediaItem.available.audioOrder.push(key);

                    }, mediaItem.available.audio);

                    var jsonFullUrl = root + mediaItem.available.text.json.url;
                    mediaItem.available.text.json.url = url.formatUriServer(jsonFullUrl, {userToken: Authenticator.authToken});
                }

                /**
                 * Saves a progress event and a dataset item to the default dataset
                 */
                trackProgress (activity) {
                    if (this.progressEvents[activity] == null) {
                        ProgressEvent.createByDatasetItemAttributes("default", this.recording.id, this.startOffset, this.endOffset, activity)
                            .then(x => { console.log("__one", x);})
                            .catch(error => {
                                console.warn("error tracking progress for media item" + error);
                            });
                        this.progressEvents[activity] = true;
                    }
                }

            }

            Media.make = function (arg) {
                return new Media(arg);
            };

            return Media;
        }]);
