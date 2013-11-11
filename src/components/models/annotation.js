var baw = window.baw = window.baw || {};

/**
 *
 * @param localIdOrResource
 * @param {*=} audioRecordingId
 * @constructor
 */
baw.Annotation = function Annotation(localIdOrResource, audioRecordingId) {

    var localId = typeof(localIdOrResource) === "number" ? localIdOrResource : undefined;
    var resource;
    if (localIdOrResource instanceof Object && localIdOrResource.constructor.name == "Resource") {
        resource = localIdOrResource;
    }

    if (!(this instanceof Annotation)) {
        throw new Error("Constructor called as a function");
    }

    this.__temporaryId__ = localId || resource.id;  //(Number.Unique() * -1);
    if (!angular.isNumber(this.__temporaryId__)) {
        throw "Is in an annotation is not a number!";
    }

    this.selected = false;
    this.audioEventTags = [];

    if (localId) {
        var now = new Date();

        this.audioRecordingId = audioRecordingId;

        this.createdAt = now;
        this.updatedAt = now;

        this.endTimeSeconds = 0.0;
        this.highFrequencyHertz = 0.0;
        this.isReference = false;
        this.lowFrequencyHertz = 0.0;
        this.startTimeSeconds = 0.0;

    }

    // ensure JSON values taken from a resource have nicely formatted values
    if (resource) {
        angular.extend(this, resource);

        this.createdAt = new Date(this.createdAt);
        this.updatedAt = new Date(this.updatedAt);

        this.endTimeSeconds = parseFloat(this.endTimeSeconds);
        this.highFrequencyHertz = parseFloat(this.highFrequencyHertz);
        this.lowFrequencyHertz = parseFloat(this.lowFrequencyHertz);
        this.startTimeSeconds = parseFloat(this.startTimeSeconds);

        this.audioEventTags = {};
        angular.forEach(this.audioEventTags, function (value, key) {
            this.audioEventTags[key] = new baw.AudioEventTag(value);
        }, this);
    }

    // strip out unnecessary values;
    this.exportObj = function () {
        return {
            // TODO:
            taggings: [],
            audioRecordingId: this.audioRecordingId,
            createdAt: this.createdAt,
            endTimeSeconds: this.endTimeSeconds,
            highFrequencyHertz: this.highFrequencyHertz,
            isReference: this.isReference,
            lowFrequencyHertz: this.lowFrequencyHertz,
            startTimeSeconds: this.startTimeSeconds,
            updatedAt: this.updatedAt,
            id: this.id
        };
    };

    this.toJSON = function () {
        return {
            id: this.id || this.__temporaryId__
        };
    };
};

baw.Annotation.create = function(arg) {
    return new baw.Annotation(arg);
};
