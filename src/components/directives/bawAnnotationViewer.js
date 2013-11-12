var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);

bawds.directive('bawAnnotationViewer', [ 'conf.paths', function (paths) {

    function variance(x, y) {
        var fraction = x / y;
        return Math.abs(fraction - 1);
    }

    function unitConversions(sampleRate, window, imageWidth, imageHeight) {
        if (sampleRate === undefined || window === undefined || !imageWidth || !imageHeight) {
            console.warn("not enough information to calculate unit conversions");
            return { pixelsPerSecond: NaN, pixelsPerHertz: NaN};
        }

        // based on meta data only
        var nyquistFrequency = (sampleRate / 2.0),
            idealPps = sampleRate / window,
            idealPph = (window / 2.0) / nyquistFrequency;

        // intentionally use width to ensure the image is correct
        var spectrogramBasedAudioLength = (imageWidth * window) / sampleRate;
        var spectrogramPps = imageWidth / spectrogramBasedAudioLength;

        // intentionally use width to ensure image is correct
        // SEE https://github.com/QutBioacousticsResearchGroup/bioacoustic-workbench/issues/86
        imageHeight = (imageHeight % 2) === 1 ? imageHeight - 1 : imageHeight;
        var imagePph = imageHeight / nyquistFrequency;

        // do consistency check (tolerance = 2%)
        if (variance(idealPph, imagePph) > 0.02) {
            console.warn("the image height does not conform well with the meta data");
        }
        if (variance(idealPps, spectrogramPps) > 0.02) {
            console.warn("the image width does not3 conform well with the meta data");
        }

        return { pixelsPerSecond: spectrogramPps, pixelsPerHertz: imagePph, nyquistFrequency: nyquistFrequency };
    }

    function updateUnitConversions(scope, imageWidth, imageHeight) {
        var conversions = {};
        if (scope.model.media && scope.model.media.spectrogram) {
            conversions = unitConversions(scope.model.media.sampleRate, scope.model.media.spectrogram.window, imageWidth, imageHeight);
        }

        var PRECISION = 6;

        return {
            conversions: conversions,
            pixelsToSeconds: function pixelsToSeconds(pixels) {
                var seconds = pixels / conversions.pixelsPerSecond;
                return seconds;
            },
            pixelsToHertz: function pixelsToHertz(pixels) {
                var hertz = pixels / conversions.pixelsPerHertz;
                return hertz;
            },
            secondsToPixels: function secondsToPixels(seconds) {
                var pixels = seconds * conversions.pixelsPerSecond;
                return pixels;
            },
            hertzToPixels: function hertzToPixels(hertz) {
                var pixels = hertz * conversions.pixelsPerHertz;
                return pixels;
            },
            invertHertz: function invertHertz(hertz) {
                return Math.abs(conversions.nyquistFrequency - hertz);
            }
        };
    }

    /**
     *
     * @param audioEvent
     * @param box
     * @param scope
     */
    function resizeOrMove(audioEvent, box, scope) {
        var boxId = baw.parseInt(box.id);

        if (audioEvent.__temporaryId__ === boxId) {
            audioEvent.startTimeSeconds = scope.model.converters.pixelsToSeconds(box.left || 0);
            audioEvent.highFrequencyHertz = scope.model.converters.invertHertz(scope.model.converters.pixelsToHertz(box.top || 0));

            audioEvent.endTimeSeconds = audioEvent.startTimeSeconds + scope.model.converters.pixelsToSeconds(box.width || 0);
            audioEvent.lowFrequencyHertz = audioEvent.highFrequencyHertz - scope.model.converters.pixelsToHertz(box.height || 0);
        }
        else {
            console.error("Box ids do not match on resizing  or move event", audioEvent.__temporaryId__, boxId);
        }
    }

    function resizeOrMoveWithApply(scope, audioEvent, box) {
        scope.$apply(function () {
            scope.__lastDrawABoxEditId__ = audioEvent.__temporaryId__;
            resizeOrMove(audioEvent, box, scope);

        });
    }

    function touchUpdatedField(audioEvent) {
        audioEvent.updatedAt = new Date();
    }

    function create(simpleBox, audioRecordingId, scope) {

        var audioEvent = new baw.Annotation(baw.parseInt(simpleBox.id), audioRecordingId);

        resizeOrMove(audioEvent, simpleBox, scope);
        touchUpdatedField(audioEvent);

        return audioEvent;
    }

    /**
     * Create an watcher for an audio event model.
     * The purpose is to allow for reverse binding from model -> drawabox
     * NB: interestingly, these watchers are bound to array indexes... not the objects in them.
     *  this means the object is not coupled to the watcher and is not affected by any operation on it.
     * @param scope
     * @param array
     * @param index
     * @param drawaboxInstance
     */
    function registerWatcher(scope, array, index, drawaboxInstance) {

        // create the watcher
        var watcherFunc = function () {
            return array[index];
        };

        // create the listener - the actual callback
        var listenerFunc = function audioEventToBoxWatcher(value) {

            if (value) {
                if (scope.__lastDrawABoxEditId__ === value.__temporaryId__) {
                    scope.__lastDrawABoxEditId__ = undefined;
                    return;
                }

                console.log("audioEvent watcher fired", value.__temporaryId__, value._selected);

                // TODO: SET UP CONVERSIONS HERE
                var top = scope.model.converters.hertzToPixels(value.highFrequencyHertz),
                    left = scope.model.converters.secondsToPixels(value.startTimeSeconds),
                    width = scope.model.converters.secondsToPixels(value.endTimeSeconds - value.startTimeSeconds),
                    height = scope.model.converters.hertzToPixels(value.highFrequencyHertz - value.lowFrequencyHertz);

                drawaboxInstance.drawabox('setBox', value.__temporaryId__, top, left, height, width, value._selected);
            }
        };

        // tag both for easy removal later
        var tag = "index" + index.toString();
        watcherFunc.__drawaboxWatcherForAudioEvent = tag;
        listenerFunc.__drawaboxWatcherForAudioEvent = tag;

        // don't know if I need deregisterer or not - use this to stop listening...
        // --
        // note the last argument sets up the watcher for compare equality (not reference).
        // this may cause memory / performance issues if the model gets too big later on
        var deregisterer = scope.$watch(watcherFunc, listenerFunc, true);
    }

    return {
        restrict: 'AE',
        scope: {
            model: '=model'
        },
        controller: 'AnnotationViewerCtrl',
        require: '', // ngModel?
        templateUrl: paths.site.files.annotationViewer,
//            compile: function(element, attributes, transclude)  {
//                // transform DOM
//            },
        link: function (scope, $element, attributes, controller) {

            // assign a unique id to scope
            scope.id = Number.Unique();

            scope.$canvas = $element.find(".annotation-viewer img + div").first();
            scope.$image = $element.find("img");


            // init unit conversion
            function updateConverters() {
                if (scope.$image[0].src) {
                    var natHeight = scope.$image[0].naturalHeight;
                    if (natHeight === undefined) {
                        // TODO: handle better
                        throw "can't determine natural height!";
                    }
                    if (natHeight !== 0 && !baw.isPowerOfTwo(natHeight)) {
                        var croppedHeight = baw.closestPowerOfTwoBelow(natHeight);
                        console.warn("The natural height (" + natHeight +
                            "px) for image " + scope.$image[0].src +
                            " is not a power of two. The image has been cropped to " + croppedHeight + "px!");

                        scope.$image.height(croppedHeight);
                    }
                }
                scope.model.converters = updateUnitConversions(scope, scope.$image.width(), scope.$image.height());
            }

            scope.$watch(function () {
                return scope.model.media.imageUrl;
            }, updateConverters);
            scope.$image[0].addEventListener('load', updateConverters, false);
            updateConverters();

            // init drawabox
            scope.model.audioEvents = scope.model.audioEvents || [];
            //scope.model.selectedAudioEvents = scope.model.selectedAudioEvents || [];


            scope.$canvas.drawabox({
                "selectionCallbackTrigger": "mousedown",

                "newBox": function (element, newBox) {
                    var newAudioEvent = create(newBox, scope.model.audioRecording.id, scope);


                    scope.$apply(function () {
                        scope.model.audioEvents.push(newAudioEvent);

                        var annotationViewerIndex = scope.model.audioEvents.length - 1;
                        element[0].annotationViewerIndex = annotationViewerIndex;

                        // register for reverse binding
                        registerWatcher(scope, scope.model.audioEvents, annotationViewerIndex, scope.$canvas);

                        console.log("newBox", newBox, newAudioEvent);
                    });
                },
                "boxSelected": function (element, selectedBox) {
                    console.log("boxSelected", selectedBox);


                    scope.$apply(function () {

                        // support for multiple selections - remove the clear
                        // TODO: this is a very inefficient method of achieving this result
                        angular.forEach(scope.model.audioEvents, function (value, key) {
                            value._selected = false;
                        });

                        // new form of selecting
                        scope.model.audioEvents[element[0].annotationViewerIndex]._selected = true;
                    });
                },
                "boxResizing": function (element, box) {
                    console.log("boxResizing");
                    resizeOrMoveWithApply(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box);

                },
                "boxResized": function (element, box) {
                    console.log("boxResized");
                    resizeOrMoveWithApply(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box);
                },
                "boxMoving": function (element, box) {
                    console.log("boxMoving");
                    resizeOrMoveWithApply(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box);
                },
                "boxMoved": function (element, box) {
                    console.log("boxMoved");
                    resizeOrMoveWithApply(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box);
                },
                "boxDeleted": function (element, deletedBox) {
                    console.log("boxDeleted");

                    scope.$apply(function () {
                        // TODO: i'm not sure how I should handle 'deleted' items yet
                        var itemToDelete = scope.model.audioEvents[element[0].annotationViewerIndex];
                        itemToDelete.deletedAt = (new Date());

//                            if (scope.model.selectedAudioEvents.length > 0) {
//                                var index = scope.model.selectedAudioEvents.indexOf(itemToDelete);
//
//                                if (index >= 0) {
//                                    scope.model.selectedAudioEvents.splice(index, 1);
//                                }
//                            }
                    });
                }
            });


        }
    };
}]);