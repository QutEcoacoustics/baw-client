var baw = window.baw = window.baw || {};


baw.Annotation = (function () {

    /**
     *
     * @param localIdOrResource
     * @param {*=} audioRecordingId
     * @constructor
     */
    var module = function Annotation(localIdOrResource, audioRecordingId) {


        var localId = typeof(localIdOrResource) === "number" ? localIdOrResource : undefined;
        var resource;
        if (localIdOrResource instanceof Object /*&& localIdOrResource.constructor.name == "Resource"*/) {
            resource = localIdOrResource;
        }

        if (!(localId || resource)) {
            throw "Valid input not provided";
        }

        if (!(this instanceof Annotation)) {
            throw new Error("Constructor called as a function");
        }

        this.__localId__ = localId || resource.id;  //(Number.Unique() * -1);
        if (!angular.isNumber(this.__localId__)) {
            throw "Is in an annotation is not a number!";
        }

        this.selected = false;
        this.audioEventTags = [];

        if (localId) {
            var now = new Date();

            this.audioRecordingId = audioRecordingId;

            this.createdAt = now;
            this.updatedAt = now;

            this._isReference = false;
            this.isDirty = true;
        }

        // ensure JSON values taken from a resource have nicely formatted values
        if (resource) {
            //angular.extend(this, resource);

            this.id = resource.id;
            this.audioRecordingId = resource.audioRecordingId;
            this.createdAt = new Date(resource.createdAt);
            this.creatorId = resource.creatorId;
            this.updatedAt = new Date(resource.updatedAt);
            this.updaterId = resource.updaterId;
            this.deletedAt = new Date(resource.deletedAt);
            this.deleterId = resource.deleterId;

            this._isReference = resource.isReference;
            this._endTimeSeconds = parseFloat(resource.endTimeSeconds);
            this._highFrequencyHertz = parseFloat(resource.highFrequencyHertz);
            this._lowFrequencyHertz = parseFloat(resource.lowFrequencyHertz);
            this._startTimeSeconds = parseFloat(resource.startTimeSeconds);

            this.audioEventTags = this.audioEventTags.map(function (value, key) {
                return baw.AudioEventTag(value);
            });
        }
    };

    // strip out unnecessary values;
    function prototype() {
        // copied from api. Special props defined below.
        var pt = {
            // from resource
            "audioRecordingId": null,
            "createdAt": null,
            "creatorId": null,
            "deletedAt": null,
            "deleterId": null,
            "id": null,
            "updatedAt": null,
            "updaterId": null,
            "taggings": [
            ]
        };

        pt._epsilsonDirty = 0.0;
        pt.__localId__ = null;
        pt.isDirty = false;

        function customProperty(prop) {
            var privateProp = "_" + prop;
            pt[privateProp] = null;
            Object.defineProperty(pt, prop, {
                enumerable: true,
                configurable: false,
                get: function () {
                    return this[privateProp];
                },
                set: function (value) {
                    if (value !== this[privateProp]) {
                        this[privateProp] = value;
                        this.isDirty = true;
                    }
                }
            });
        }

        customProperty("startTimeSeconds");
        customProperty("endTimeSeconds");
        customProperty("highFrequencyHertz");
        customProperty("lowFrequencyHertz");
        customProperty("isReference");

        pt.isNew = function() {

            return this.__localId__ !== this.id;
        };

        pt.exportObj = function exportObj() {
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

        pt.toJSON = function toJSON() {
            return {
                id: this.id || this.__localId__
            };
        };

        return pt;
    }

    module.prototype = prototype();


    module.create = function (arg) {
        return new baw.Annotation(arg);
    };

    return module;
})();