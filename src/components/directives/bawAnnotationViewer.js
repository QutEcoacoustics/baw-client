var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);

bawds.directive('bawAnnotationViewer',
    [   'conf.paths',
        'bawApp.unitConverter',
        'AudioEvent',
        'Tag',
        function (paths, unitConverter, AudioEvent, Tag) {

            /**
             * Create an watcher for an audio event model.
             * The purpose is to allow for binding from model -> drawabox || model -> server
             * NB: interestingly, these watchers are bound to array indexes... not the objects in them.
             *  this means the object is not coupled to the watcher and is not affected by any operation on it.
             */
            function watchSingleAnnotation(scope, array, index) {

                // create the watcher
                var watcherFunc = function () {
                    return array[index];
                };

                // tag for tracking
                watcherFunc.__watcherForAudioEvent = index;

                // after deletion, the forward section of the array is shifted one left
                // this means the watcher for the deleted item, now watches a valid item
                // and the end of the watchers, is watching out-of-bounds in the array.
                // if we add a new element afterwards, then this function will create a duplicate watcher
                // therefore, if we find a watcher on the scope that already monitors the index we are about to watch
                // do not continue to add another watcher
                var alreadyExists = scope.$$watchers.some(function (watcher) {
                    return watcher.get.__watcherForAudioEvent === index;
                });
                if (alreadyExists) {
                    console.debug("Skipped adding new watch - an existing watch was already present", index);
                    return;
                }

                // note the last argument sets up the watcher for compare equality (not reference).
                // this may cause memory / performance issues if the model gets too big later on
                var deregisterer = scope.$watch(watcherFunc, modelUpdated, true);

            }

            /**
             * This watcher is dedicated to monitoring the collection of audio events for changes,
             * rather than the objects within the collection
             */
            function watchAudioEventCollection(scope) {

                var deregisterCollection = scope.$watchCollection(function () {
                    return scope.model.audioEvents;
                }, modelCollectionUpdated);
            }

            function watchForSpectrogramChanges(scope, imageElement) {
                function updateUnitConverters(newValue, oldValue) {
                    if (newValue) {
                        console.debug("AnnotationEditor:watchForSpectrogramChanges:updateUnitConverters");
                    }
                    else {
                        console.debug("AnnotationEditor:watchForSpectrogramChanges:updateUnitConverters: update cancelled, newValue is falsey");
                        return;
                    }

                    scope.model.converters = unitConverter.getConversions({
                        sampleRate: scope.model.media.sampleRate,
                        spectrogramWindowSize: scope.model.media.spectrogram ? scope.model.media.spectrogram.window : null,
                        endOffset: scope.model.media.endOffset,
                        startOffset: scope.model.media.startOffset,
                        imageElement: scope.$image[0],
                        audioRecordingAbsoluteStartDate: scope.model.media.datetime
                    });

                    // redraw all boxes already drawn (hacky way to force angular to consider these objects changed!)
                    scope.model.audioEvents.forEach(function (value) {
                        if (value) {
                            value.forceDodgyUpdate = (value._forceDodgyUpdate || 0) + 1;
                        }
                    });
                }

                scope.$watch('model.media.spectrogram.url', updateUnitConverters);
                scope.$image[0].addEventListener('load', function () {
                    // dom event, not in $digest cycle, thus apply
                    scope.$apply(function () {
                        updateUnitConverters();
                    });
                }, false);
            }

            /**ȻɌɄƉ**/

            var UPDATER_DRAWABOX = "DRAWABOX";
            var UPDATER_PAGE_LOAD = "PAGE_LOAD";
            var DRAWABOX_ACTION_RESIZE_OR_MOVE = "DAB_RESIZE_OR_MOVE";
            var DRAWABOX_ACTION_DELETE = "DAB_DELETE";
            var DRAWABOX_ACTION_CREATE = "DAB_CREATE";
            var DRAWABOX_ACTION_SELECT = "DAB_SELECT";

            /**
             * Update the model. Events must be emitted from drawabox.
             * Handles emitted create, update, delete
             */
            function drawaboxUpdatesModel(scope, annotation, box, action, finishedEvent) {
                console.debug("AnnotationEditor:drawaboxUpdatesModel:", action);

                // invariants
                // no longer true for hover state
                //        if (action === DRAWABOX_ACTION_SELECT && (box.selected !== true || box.hovering !== true)) {
                //            throw "AnnotationEditor:drawaboxUpdatesModel: Invariant failed for selection action";
                //        }
                if (action !== DRAWABOX_ACTION_SELECT && action !== DRAWABOX_ACTION_CREATE && box.selected !== annotation.selected) {
                    throw "AnnotationEditor:drawaboxUpdatesModel: Invariant failed for non-selection action";
                }
                if (action !== DRAWABOX_ACTION_CREATE && !annotation) {
                    throw "AnnotationEditor:drawaboxUpdatesModel: Invariant failed: annotation must be null when creating a new box";
                }

                // pre assertion
                var wasDirty = annotation ? annotation.isDirty : null;
                var boxId = baw.parseInt(box.id);
                if (annotation && annotation.__localId__ !== boxId) {
                    console.error("Box ids do not match on resizing or move event", annotation.__localId__, boxId);
                    return;
                }

                scope.$apply(function () {
                    // create
                    if (action === DRAWABOX_ACTION_CREATE) {
                        //noinspection AssignmentToFunctionParameterJS
                        annotation = new baw.Annotation(baw.parseInt(box.id), scope.model.media.id);
                        scope.model.audioEvents.push(annotation);
                    }

                    annotation.$lastUpdater = UPDATER_DRAWABOX;
                    annotation.$intermediateEvent = finishedEvent;

                    // only the select action selects, and only the select action does not update the bounds of the annotation
                    if (action === DRAWABOX_ACTION_SELECT) {
                        // support for multiple selections - remove the clear
                        // TODO: this is an inefficient method of achieving this result
                        scope.model.audioEvents.forEach(function (value) {
                            value.selected = false;
                        });

                        annotation.selected = box.selected;
                        annotation.hovering = box.hovering;
                    }
                    else {
                        // resize / move
                        annotation.highFrequencyHertz =  scope.model.converters.toHigh(box.top);
                        annotation.startTimeSeconds = scope.model.converters.toStart(box.left);
                        annotation.endTimeSeconds = scope.model.converters.toEnd(box.left, box.width);
                        annotation.lowFrequencyHertz = scope.model.converters.toLow(box.top, box.height);

                        if (!annotation.$intermediateEvent) {
                            // funny bug. resized does not trigger a model updated... although moved does.
                            // so force an update for resized events
                            annotation.forceDodgyUpdate = (annotation.forceDodgyUpdate || 0) + 1;
                        }
                    }

                    // delete
                    if (action === DRAWABOX_ACTION_DELETE) {
                        annotation.toBeDeleted = true;
                    }
                });

                // post assertion
                if (action === DRAWABOX_ACTION_SELECT) {
                    console.assert(annotation.isDirty == wasDirty,
                        "AnnotationEditor:drawaboxUpdatesModel: Post condition failed for selection triggering a isDirty state");
                }
                else {
                    console.assert(annotation.isDirty,
                        "AnnotationEditor:drawaboxUpdatesModel: Post condition failed for action not triggering a isDirty state");
                }
                if (action === DRAWABOX_ACTION_DELETE) {
                    console.assert(annotation.toBeDeleted === true,
                        "AnnotationEditor:drawaboxUpdatesModel: Post condition failed for ensuring a annotation is deleted");
                }
            }

            /**
             * Update the drawabox control.
             * Handles model updates (not created or deleted events)
             */
            function modelUpdatesDrawabox(scope, annotation) {
                console.debug("AnnotationEditor:modelUpdatesDrawabox:", annotation.__localId__);

                var drawaboxInstance = scope.$drawaboxElement,
                    top = scope.model.converters.toTop(annotation.highFrequencyHertz),
                    left = scope.model.converters.toLeft(annotation.startTimeSeconds),
                    width = scope.model.converters.toWidth(annotation.endTimeSeconds, annotation.startTimeSeconds),
                    height = scope.model.converters.toHeight(annotation.highFrequencyHertz, annotation.lowFrequencyHertz);

                drawaboxInstance.drawabox('setBox', annotation.__localId__, top, left, height, width,
                    annotation.selected);
            }

            var serverAction = {
                create: "create",
                remove: "remove",
                update: "update"
            };

            var serverQueue = {

            };
            var defaultQueueItem = {
                create: {
                    current: null
                },
                update: {
                    current: null,
                    pending: null
                },
                remove: {
                    current: null
                },
                count: function () {
                    return (this.create.current && 1 || 0) +
                        (this.update.current && 1 || 0) +
                        (this.update.pending && 1 || 0) +
                        (this.remove.current && 1 || 0);
                },
                executeNext: function () {
                    var f = this.create.current || this.update.current || this.update.pending || this.remove.current;
                    if (this.update.pending) {
                        this.update.current = this.update.pending;
                        this.update.pending = null;
                    }

                    f();
                }
            };

            function modelUpdatesServer(scope, annotation) {

                // invariants
                console.assert(annotation,
                    "AnnotationEditor:modelUpdatesServer: Invalid state! Cannot call this method with a falsy value!");
                console.assert(annotation.isDirty === true,
                    "AnnotationEditor:modelUpdatesServer: Invalid state! The annotation should be dirty (but isn't)!");


                var localId = annotation.__localId__;
                var currentQueue = serverQueue[localId] = serverQueue[localId] || angular.copy(defaultQueueItem);

                var makeExecute = function (method, action) {
                    return function () {
                        var postData = annotation.exportObj();
                        var parameters = {recordingId: postData.audioRecordingId, audioEventId: postData.id};
                        AudioEvent[method](parameters, postData,
                            function success(value, headers) {
                                console.debug("AnnotationEditor:modelUpdatesServer: " + action + " success", value);
                                serverUpdatesModel(scope, action, value, annotation);
                            },
                            function error(response) {
                                console.error("AnnotationEditor:modelUpdatesServer: " + action + " FAILURE", response);
                            });
                    };
                };

                if (annotation.isNew()) {
                    if (currentQueue.create.current != null) {
                        // convert to update instead
                        // enqueue update
                        console.assert(currentQueue.update.current == null);
                        currentQueue.update.current = makeExecute("update", serverAction.update);
                        return;

                    }
                    else {
                        // enqueue create
                        currentQueue.create.current = makeExecute("save", serverAction.create);

                        // execute create
                        currentQueue.create.current();
                        return;
                    }
                }

                if (annotation.toBeDeleted === true) {
                    if (currentQueue.remove.current != null) {
                        // not valid - can't delete twice
                        throw "AnnotationEditor:modelUpdatesServer: can't delete an annotation twice!";
                    }
                    else {
                        // enqueue delete
                        currentQueue.remove.current = makeExecute("remove", serverAction.remove);

                        // execute delete
                        currentQueue.remove.current();
                        return;
                    }
                }

                // default - update!
                if (currentQueue.update.current != null) {
                    // overwrite pending
                    currentQueue.update.pending = makeExecute("update", serverAction.update);
                }
                else {
                    // enqueue update
                    currentQueue.update.current = makeExecute("update", serverAction.update);

                    // execute update
                    currentQueue.update.current();
                }
            }

            function serverUpdatesModel(scope, action, updatedValue, oldValue) {
                console.debug("AnnotationEditor:serverUpdatesModel: " + action);

                // if there are more things in the queue execute them
                var oldId = oldValue.__localId__,
                    queuedAnnotation = serverQueue[oldId],
                    count = queuedAnnotation.count();
                console.assert(count >= 1, "Invalid server queue state for annotation ", oldId);


                // action complete - clear it
                queuedAnnotation[action].current = null;

                // should reset dirty flag for create/update
                if (action === serverAction.create || action === serverAction.update) {
                    console.assert(updatedValue, "After create/update the object should be returned");

                    // update metadata, but don't update dimensions, only update dimensions if it is the last save in the queue
                    // if there were other server actions left to do, run them now
                    if (count > 1) {
                        oldValue.mergeResource(updatedValue, true);
                        queuedAnnotation.executeNext();
                    }
                    else {
                        oldValue.mergeResource(updatedValue, false);
                        // saving complete
                        oldValue.isDirty = false;
                    }
                    Tag.resolveAll(oldValue.tags, scope.$parent.tags);
                }
                else {
                    // should clean up resources for delete
                    console.assert(action === serverAction.remove, "The remaining case must be a delete server action");
                    console.assert(count == 1, "There should be no more actions enqueued after a delete");

                    // we could integrate the updated value from the server here but
                    // a) there's no point, its just being removed from the model anyway
                    // and b) the DELETE api does not return a value


                    // saving complete (changing isDirty not necessary, since immediately deleted)
                    //oldValue.isDirty = false

                    // this, by reference, gets rid of the element.
                    _.remove(scope.model.audioEvents, function (value) {
                        return value.__localId__ == oldValue.__localId__;
                    });

                    // FYI - this will result in
                    // a) every annotation after index being forced to update
                    // b) every annotation after index will have its element's annotationViewerIndex reset
                    // c) result in a dudd out-of-bounds watcher at for the end of the audioEvents array (elements shifted back one position)
                }
            }

            /**
             * This method should be called when an Annotation model is updated.
             * There are four possible cases:
             *  1) Page load (Ȼ R ɄƉ)
             *  2) Single Edit change (ȻɌ UD)
             *  3) Drawabox change (C Ɍ UD)
             *  4) Server async return for (reverse ȻɌ U Ɖ)
             * @param changedAnnotation
             * @param oldAnnotation
             * @param scope
             */
            function modelUpdated(changedAnnotation, oldAnnotation, scope) {
                if (!changedAnnotation) {
                    console.debug("AnnotationEditor:modelUpdated: Falsy annotation, skip update.");
                    return;
                }

                console.debug("AnnotationEditor:modelUpdated:", changedAnnotation.__localId__,
                    changedAnnotation.selected);

                // invariants
                console.assert(changedAnnotation.$lastUpdater !== UPDATER_PAGE_LOAD || changedAnnotation.isDirty !== false,
                    "AnnotationEditor:modelUpdated: Invalid state! If the last update came from page load then the the annotation must NOT be dirty!");
                console.assert(!changedAnnotation.toBeDeleted || changedAnnotation.toBeDeleted && changedAnnotation.isDirty === true,
                    "AnnotationEditor:modelUpdated: Invalid state! If the the delete flag is set the annotation must be dirty!");

                // if the last update was done by the drawabox control, do not propagate it back to drawabox
                if (changedAnnotation.$lastUpdater === UPDATER_DRAWABOX) {
                    // reset flag
                    changedAnnotation.$lastUpdater = null;
                }
                else {
                    modelUpdatesDrawabox(scope, changedAnnotation);
                }

                // TODO: the following block is dodgy as shit, totally breaks separation of concerns.... but it is efficient
                if (changedAnnotation.selected) {
                    scope.model.selectedAudioEvent = changedAnnotation;
                }
                if (changedAnnotation.toBeDeleted) {
                    changedAnnotation.selected = false;
                    scope.model.selectedAudioEvent = null;
                }

                if (changedAnnotation.isDirty && !changedAnnotation.$intermediateEvent) {
                    // reset flag
                    changedAnnotation.$intermediateEvent = null;
                    modelUpdatesServer(scope, changedAnnotation);
                }

                // reset $intermediateEvent - warning unknown effects. Modified so that single-edit changes will persist
                if (changedAnnotation.$intermediateEvent) {
                    changedAnnotation.$intermediateEvent = false;
                }


            }

            function modelCollectionUpdated(newCollection, oldCollection, scope) {
                console.debug("AnnotationEditor:modelCollectionUpdated:", newCollection, oldCollection);

                var drawaboxInstance = scope.$drawaboxElement;

                // now for all new events, add them to drawabox, if they are not there already!
                scope.model.audioEvents.forEach(function (value, index) {
                    // after a while the array become sparse... skip empty spots
                    if (!value) {
                        return;
                    }

                    var element;

                    // does the annotation's box exist in the DOM?
                    var exists = drawaboxInstance.drawabox('exists', value.__localId__);
                    if (exists[0] === false) {
                        // if not, add the annotation into the DOM
                        element = drawaboxInstance.drawabox('insert', value.__localId__)[0][0];
                    }
                    else {
                        // the element already exists
                        element = exists[0];
                    }

                    if (element && element.annotationViewerIndex === index) {
                        // things are peachy, no-op
                    }
                    else if (element.annotationViewerIndex === undefined) {
                        // the annotation has an element in the dom, but has not been set up for tracking
                        element.annotationViewerIndex = index;

                        // register for reverse binding
                        watchSingleAnnotation(scope, scope.model.audioEvents, index);
                    }
                    else {
                        // reset the index - this should only happen after a delete
                        console.debug("AnnotationEditor:modelCollectionUpdated: resetting element index",
                            element.annotationViewerIndex, index);
                        element.annotationViewerIndex = index;
                        //throw "Array and elements on drawabox out of sync, shit fucked up";
                    }
                });
            }

            /****/

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

                    scope.$drawaboxElement = $element.find(".annotation-viewer .annotationOverlay").first();
                    scope.$image = $element.find("img");


                    // init unit conversion
                    watchForSpectrogramChanges(scope, scope.$image);

                    // init drawabox
                    if (!angular.isArray(scope.model.audioEvents)) {
                        throw "bawAnnotationViewer: Model not ready, audioEvents model object not an array.";
                    }
                    scope.model.selectedAudioEvent = scope.model.selectedAudioEvent || {};

                    scope.$drawaboxElement.drawabox({
                        "selectionCallbackTrigger": "mousedown",
                        "newBox": function (element, newBox) {
                            console.log("newBox", newBox, false);
                            drawaboxUpdatesModel(scope, null, newBox, DRAWABOX_ACTION_CREATE);
                        },
                        "boxSelected": function (element, selectedBox) {
                            //console.log("boxSelected", selectedBox);
                            drawaboxUpdatesModel(scope, scope.model.audioEvents[element[0].annotationViewerIndex],
                                selectedBox,
                                DRAWABOX_ACTION_SELECT, true);
                        },
                        "boxResizing": function (element, box) {
                            //console.log("boxResizing");
                            drawaboxUpdatesModel(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box,
                                DRAWABOX_ACTION_RESIZE_OR_MOVE, true);
                        },
                        "boxResized": function (element, box) {
                            //console.log("boxResized");
                            drawaboxUpdatesModel(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box,
                                DRAWABOX_ACTION_RESIZE_OR_MOVE, false);
                        },
                        "boxMoving": function (element, box) {
                            //console.log("boxMoving");
                            drawaboxUpdatesModel(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box,
                                DRAWABOX_ACTION_RESIZE_OR_MOVE, true);
                        },
                        "boxMoved": function (element, box) {
                            //console.log("boxMoved");
                            drawaboxUpdatesModel(scope, scope.model.audioEvents[element[0].annotationViewerIndex], box,
                                DRAWABOX_ACTION_RESIZE_OR_MOVE, false);
                        },
                        "boxDeleted": function (element, deletedBox) {
                            //console.log("boxDeleted");
                            // TODO: delete index bound watcher... do not change array layout, keep it sparse...
                            // ...but only after server operation is a success
                            drawaboxUpdatesModel(scope, scope.model.audioEvents[element[0].annotationViewerIndex],
                                deletedBox,
                                DRAWABOX_ACTION_DELETE, false);
                        }
                    });

                    // finally start watching the audioEvents collection for any changes!
                    watchAudioEventCollection(scope);
                }
            };
        }]);