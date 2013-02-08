"use strict";

/**
 * The listen controller. Show a spectrogram, listen to audio, annotate the spectrogram.
 * @param $scope
 * @param $element
 * @param $attrs
 * @param $transclude
 * @constructor
 */
function AnnotationViewerCtrl($scope, $element, $attrs, $transclude) {

    $scope.getTag = function getTag(id) {
        id = parseInt(id);
        if (id) {
            // TODO: SOME MAGIC, get tag label from a list that has hopefully already been loaded somewhere
            return "Magic Name " + id;
        }
        else {
            return "Unknown Tag Label";
        }
    };

    $scope.positionLabel = function (audioEvent) {
        return $scope.model.converters.secondsToPixels(audioEvent.startTimeSeconds);
    };

    $scope.positionLine = function () {
      return $scope.model.converters.secondsToPixels($scope.model.audioElement.position);
    };


    // updated in directive
    $scope.model.converters = $scope.model.converters || {};


}

function Annotation(localIdOrResource, audioRecordingId) {

    var localId = typeof(localIdOrResource) === "number" ? localIdOrResource : undefined;
    var resource;
    if (localIdOrResource instanceof Object && localIdOrResource.constructor.name == "Resource") {
        resource = localIdOrResource;
    }

    if (!(this instanceof Annotation))
        throw new Error("Constructor called as a function");

    var now = new Date();

    this.__temporaryId__ = localId || Number.Unique();
    this._selected = false;
    this.audioEventTags = [];

    if (localId) {
        this.audioRecordingId = audioRecordingId;

        this.createdAt = now;
        this.updatedAt = now;

        this.endTimeSeconds = 0.0;
        this.highFrequencyHertz = 0.0;
        this.isReference = false;
        this.lowFrequencyHertz = 0.0;
        this.startTimeSeconds = 0.0;

    }

    if (resource) {
        angular.extend(this, resource);

        this.createdAt = new Date(this.createdAt);
        this.updatedAt = new Date(this.updatedAt);

        this.endTimeSeconds = parseFloat(this.endTimeSeconds);
        this.highFrequencyHertz = parseFloat(this.highFrequencyHertz);
        this.lowFrequencyHertz = parseFloat(this.lowFrequencyHertz);
        this.startTimeSeconds = parseFloat(this.startTimeSeconds);
    }
}

AnnotationViewerCtrl.$inject = ['$scope', '$element', '$attrs', '$transclude'];