(function (undefined) {
    var bawds = angular.module('bawApp.directives', []);

    bawds.directive('bawRecordInformation', function () {

        return {
            restrict: 'AE',
            scope: false,
            /* priority: ???  */
//            controller: 'RecordInformationCtrl',
            /* require: ??? */
            /*template: "<div></div>",*/
            templateUrl: "/assets/record_information.html",
            replace: false,
            /*compile: function(tElement, tAttrs, transclude) {

             },*/
            link: function (scope, iElement, iAttrs, controller) {
                scope.name = scope[iAttrs.ngModel];


            }

        }
    });

    bawds.directive('bawDebugInfo', function () {
        return {
            restrict: 'AE',
            replace: true,
            template: '<div><a href ng-click="showOrHideDebugInfo= !showOrHideDebugInfo">Debug info {{showOrHideDebugInfo}}</a><pre ui-toggle="showOrHideDebugInfo" class="ui-hide"  ng-bind="print()"></pre></div>',
            link: function (scope, element, attrs) {
                if (!scope.print) {
                    //console.warn("baw-debug-info missing parent scope, no print function");
                    scope.print = bawApp.print;
                }
            }
        }
    });

    bawds.directive('bawJsonBinding', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attr, ngModel) {

                function catchParseErrors(viewValue) {
                    try {
                        var result = angular.fromJson(viewValue);
                    } catch (e) {
                        ngModel.$setValidity('bawJsonBinding', false);
                        return '';
                    }
                    ngModel.$setValidity('bawJsonBinding', true);
                    return result;
                }

                ngModel.$parsers.push(catchParseErrors);
                ngModel.$formatters.push(angular.toJson)
            }
        };
    });

    // ensures formatters are run on input blur
    bawds.directive('renderOnBlur', function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elm, attrs, ctrl) {
                elm.bind('blur', function () {
                    var viewValue = ctrl.$modelValue;
                    for (var i in ctrl.$formatters) {
                        viewValue = ctrl.$formatters[i](viewValue);
                    }
                    ctrl.$viewValue = viewValue;
                    ctrl.$render();
                });
            }
        };
    });


    bawds.directive('isGuid', function () {
        return {

            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {
                var isList = typeof attrs.ngList !== "undefined";

                // push rather than unshift... we want to test last
                ctrl.$parsers.push(function (viewValue) {
                    var valid = true;
                    if (isList) {
                        for (var i = 0; i < viewValue.length && valid; i++) {
                            valid = baw.GUID_REGEXP.test(viewValue[i]);
                        }
                    }
                    else {
                        valid = baw.GUID_REGEXP.test(viewValue);
                    }

                    if (valid) {
                        // it is valid
                        ctrl.$setValidity('isGuid', true);
                        return viewValue;
                    } else {
                        // it is invalid, return undefined (no model update)
                        ctrl.$setValidity('isGuid', false);
                        return undefined;
                    }
                });
            }
        };
    });

    // implements infinite scrolling
    // http://jsfiddle.net/vojtajina/U7Bz9/
    bawds.directive('whenScrolled', function () {
        return function (scope, elm, attr) {
            var raw = elm[0];

            elm.bind('scroll', function () {
                console.log('scrolled');
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled);
                }
            });
        };
    });


    bawds.directive('bawAnnotationViewer', function () {

        function variance(x, y) {
            var fraction = x / y;
            return Math.abs(fraction - 1);
        }

        function unitConversions(sampleRate, window, imageWidth, imageHeight) {
            if (sampleRate === undefined || window === undefined || !imageWidth || !imageHeight) {
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
                console.warn("the image width does not conform well with the meta data");
            }

            return { pixelsPerSecond: spectrogramPps, pixelsPerHertz: imagePph};
        }

        function updateUnitConversions(scope, imageWidth, imageHeight) {
            var conversions = unitConversions(scope.model.media.sampleRate, scope.model.media.window, imageWidth, imageHeight);

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
            var boxId = parseInt(box.id);

            if (audioEvent.__temporaryId__ === boxId) {
                audioEvent.startTimeSeconds = scope.model.converters.pixelsToSeconds(box.left || 0);
                audioEvent.highFrequencyHertz = scope.model.converters.pixelsToHertz(box.top || 0);

                audioEvent.endTimeSeconds = audioEvent.startTimeSeconds + scope.model.converters.pixelsToSeconds(box.width || 0);
                audioEvent.lowFrequencyHertz = audioEvent.highFrequencyHertz + scope.model.converters.pixelsToHertz(box.height || 0);
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

            var audioEvent = new baw.Annotation(parseInt(simpleBox.id), audioRecordingId);

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
            var deregisterer = scope.$watch(watcherFunc, listenerFunc, true)
        }

        return {
            restrict: 'AE',
            scope: {
                model: '=model'
            },
            controller: 'AnnotationViewerCtrl',
            require: '', // ngModel?
            templateUrl: '/assets/annotation_viewer.html',
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
                    scope.model.converters = updateUnitConversions(scope, scope.$image.width(), scope.$image.height());
                }

                scope.$watch(function () {
                    return scope.model.media.imageUrl
                }, updateConverters);
                scope.$image[0].addEventListener('load', updateConverters, false);
                updateConverters();

                // init drawabox
                scope.model.audioEvents = scope.model.audioEvents || [];
                //scope.model.selectedAudioEvents = scope.model.selectedAudioEvents || [];


                scope.$canvas.drawabox({
                    "selectionCallbackTrigger": "mousedown",
                    "newBox": function (element, newBox) {
                        var newAudioEvent = create(newBox, "a dummy id!", scope);


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

                        // support for multiple selections - remove the clear
                        scope.$apply(function () {
                            //scope.model.selectedAudioEvents.length = 0;
                            //scope.model.selectedAudioEvents.push(scope.model.audioEvents[element[0].annotationViewerIndex]);

                            angular.forEach(scope.model.audioEvents, function (value, key) {
                                value._selected = false;
                            });

                            // new form of selecting
                            scope.model.audioEvents[element[0].annotationViewerIndex]._selected = true
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
        }
    });

    /**
     * A directive for binding the model to data off an audio element.
     * Most things are oneway bindings
     */
    bawds.directive('ngAudio', function () {
        return {
            restrict: 'A',
            link: function (scope, elements, attributes, controller) {
                var element = elements[0];
                if (element.nodeName !== "AUDIO") {
                    throw 'Cannot put ngAudio element on an element that is not a <audio />';
                }

                var events = {'abort': undefined, 'canplay': undefined, 'canplaythrough': undefined,
                    'durationchange': function (event) {
                        scope.$safeApply2(function () {
                            if (attributes.ngAudio) {
                                var target = scope.$eval(attributes.ngAudio);
                                if (target) {
                                    target.duration = element.duration;
                                    return;
                                }
                            }

                            scope.duration = element.duration;
                        });

                    },
                    'emptied': undefined, 'ended': undefined,
                    'error': undefined, 'loadeddata': undefined, 'loadedmetadata': undefined, 'loadstart': undefined, 'mozaudioavailable': undefined,
                    'pause': undefined, 'play': undefined, 'playing': undefined, 'progress': undefined, 'ratechange': undefined, 'seeked': undefined, 'seeking': undefined,
                    'suspend': undefined, 'timeupdate': undefined, 'volumechange': undefined, 'waiting': undefined};

                angular.forEach(events, function (value, key) {
                    if (value) {
                        element.addEventListener(key, value, false);

                        // initialise first time
                        value();
                    }
                });

                // position binding - reverse (element to model)
                // TODO: we can optimise this, it does not always need to be running
                window.requestAnimationFrame(function audioElementPositionRAF() {
                    // need to request each new frame
                    window.requestAnimationFrame(audioElementPositionRAF);
                    if (attributes.ngAudio) {
                        var target = scope.$eval(attributes.ngAudio);
                        if (target) {
                            var position = element.currentTime;
                            if (target.position != position) {
                                scope.$safeApply2(function () {
                                    target.position = position;
                                });
                            }
                        }
                    }
                }, elements[0]);

            }
        }
    });

    /**
     * A cross record element checker
     */
    bawds.directive('bawChecked', ['$parse', function ($parse) {

        // a cache of elements for each radio group
        var library = {};


        return {
            restict: 'A',
            link: function radioInputType(scope, element, attr) {
                // make the name unique, if not defined
                if (baw.angularCopies.isUndefined(attr.name)) {
                    element.attr('name', Number.Unique());
                }

                var getter = $parse(attr.bawChecked);
                var assigner = getter.assign;

                    // store elements from same group to enable mass updates
                library[attr.name] = library[attr.name] || [];
                library[attr.name].push({e: element, s: scope, g: getter, a: assigner});



                // forward binding from model
                // aggressively updates all elements
                scope.$watch(getter, function (newValue, oldValue) {
                    if (newValue) {
                        // if a true value is set, aggressively set others to false
                        angular.forEach(library[attr.name], function (libraryItem) {
                            if (libraryItem.e === element) {
                                libraryItem.e[0].checked = true;
                            } else {
                                libraryItem.e[0].checked = false;
                                libraryItem.a(libraryItem.s, false);
                            }
                        });
                    }
                    else {
                        // if it's false, just make sure it is checked right (don't perpetuate the loop)
                        element[0].checked = false;
                    }
                });

                // reverse bindings, elements to model
                function updateModel(event) {
                    var isChecked = event.target.checked;

                    var newest = library[attr.name][library[attr.name].length - 1];
                    // STUPID ARSE HACK... for some reason the latest item although selected does not properly update
                    // the 'last' value on the watch. so when it is first set to false nothing happens.
                    // therefore *force* a change here by doing a separate apply with a bullshit value
                    scope.$apply(function () {
                        newest.a(newest.s, null);
                    });

                    scope.$apply(function () {
                        assigner(scope, isChecked);

                        if (newest.e[0] != event.target) {
                            newest.a(newest.s, !isChecked);
                        }
                    });

                }

                element.bind('click', updateModel);

            }
        }
    }]);


    /**
     * A directive for binding the position of an element to the model.
     * The binding uses translate transforms.
     *
     * ONLY one way binding supported at the moment
     */
    bawds.directive('bawTranslateX', function () {

        var transformSupport = Modernizr.csstransforms;
        var transformProperty = 'left';
        if (transformSupport) {
            transformProperty = Modernizr.prefixed('transform');
        }


        return {
            restrict: 'A',
            link: function (scope, elements, attributes, controller) {
                var element = elements[0];

                scope.$watch(attributes.bawTranslateX, function (newValue, oldValue) {
                    if (transformSupport) {
                        element.style[transformProperty] = 'translateX(' + newValue.toFixed(3) + 'px)';
                    }
                    else {
                        element.style[transformProperty] = '' + newValue.toFixed(3) + 'px';
                    }
                });
            }
        }
    });

    bawds.directive('bawInjectTransformers', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            priority: -1,
            link: function (scope, element, attr, ngModel) {
                var local = scope.$eval(attr.bawInjectTransformers);

                if (!angular.isObject(local) || !angular.isFunction(local.fromModel) || !angular.isFunction(local.fromElement)) {
                    throw "The bawInjectTransformers must be bound to an object with two functions (`fromModel` and `fromElement`)";
                }

                ngModel.$parsers.push(local.fromElement);
                ngModel.$formatters.push(local.fromModel);
            }
        };
    });


})();

