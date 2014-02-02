var bawds = bawds || angular.module("bawApp.directives", ["bawApp.configuration"]);

/**
 * A directive for binding the model to data off an audio element.
 * Most things are oneway bindings
 *
 * This directive is incomplete. The potential exists for many other cool bindings,
 * like a "isBuffering" binding.
 */
bawds.directive("ngAudio", ["$parse", function ($parse) {
    /* const */
    var readyStates = {
        "haveNothing": 0,
        "haveMetadata": 1,
        "haveCurrentData": 2,
        "haveFutureData": 3,
        "haveEnoughData": 4
    };

    return {
        restrict: "A",
        link: function (scope, elements, attributes, controller) {
            var element = elements[0];
            if (element.nodeName !== "AUDIO") {
                throw "Cannot put ngAudio element on an element that is not a <audio />";
            }

            var expression;
            attributes.$observe("ngAudio", function (interpolatedValue) {
                expression = $parse(attributes.ngAudio);
            });

            /*
             * FORWARD BINDING
             *
             * NOTE: only some properties are bound forward
             */

            var target;
            scope.$watch(function () {
                return expression(scope);
            }, function (newValue, oldValue) {
                target = newValue;
            });

            // volume
            scope.$watch(function () {
                return target ? target.volume : null;
            }, function updateVolume(newValue, oldValue) {
                element.volume = newValue;
            });

            // muted
            scope.$watch(function () {
                return target ? target.muted : null;
            }, function updateMuted(newValue, oldValue) {
                element.muted = newValue === null ? null : !!newValue;
            });

            // currentTime - this watcher is registered once there"s enough data loaded to seek
            var rafOn = false;
            var lastRafPosition = null;
            var watchPosition = function () {
                scope.$watch(function () {
                    return target ? target.position : null;
                }, function (newValue, oldValue) {
                    if (newValue !== null) {

                        // We must not reverse bind constantly.
                        // This is an attempt to disable binding loop.
                        // Only a problem when playing (currentTime is constantly changing)
                        if (rafOn && lastRafPosition === newValue) {
                            return;
                        }

                        element.currentTime = newValue;
                    }
                    // else ignore change
                });
            }


            function play() {
                element.play();
            }

            function pause() {
                element.pause();
            }

            function toStart() {
                element.currentTime = 0;
            }

            /*
             * REVERSE BINDING
             */

            var propertiesToUpdate = ["duration", "src", "currentSrc", "volume", "muted", "playbackRate", "readyState"];

            function updateObject(src, dest) {
                for (var i = 0; i < propertiesToUpdate.length; i++) {
                    dest[propertiesToUpdate[i]] = src[propertiesToUpdate[i]];
                }
            }

            function updateState(event, isPlaying) {
                console.debug("ngAudio:audioElement:eventType: ", event ? event.type : "<unknown>");

                scope.$safeApply2(function () {
                    if (attributes.ngAudio) {
                        var target = expression(scope);
                        if (!target) {
                            expression.assign(scope, {});
                            target = expression(scope);
                        }

                        // attach modification functions to model
                        target.play = target.play || play;
                        target.pause = target.pause || pause;
                        target.toStart = target.toStart || toStart;

                        target.currentState = event && event.type || "unknown";

                        target.position = element.currentTime;

                        updateObject(element, target);

                        target.isPlaying = !element.paused;
                        target.canPlay = element.readyState >= readyStates.haveFutureData;

                        return;
                    }
                    scope.currentState = event && event.type || "unknown";
                    updateObject(element, scope);
                });
            }

            // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Events/Media_events
            var events = {
                "abort": updateState,
                "canplay": updateState,
                "canplaythrough": updateState,
                "durationchange": updateState,
                "emptied": updateState,
                "ended": updateState,
                "error": function (event) {
                    console.error("ngAudio:audioElement:errorEvent", event);
                    updateState(event);
                },
                "loadeddata": updateState,
                "loadedmetadata": function(event) {
                    watchPosition();
                    updateState(event);
                },
                "loadstart": updateState,
                "mozaudioavailable": undefined,
                "pause": updateState,
                "play": updateState,
                "playing": function (event) {
                    // restart request animation frame
                    audioElementPositionRAF();
                    updateState(event);
                },
                "progress": updateState,
                "ratechange": updateState,
                "seeked": updateState,
                "seeking": updateState,
                "suspend": updateState,
                // this event would update progress
                // however it does not update often enough and is not smooth
                // thus we use request animation frame instead
                "timeupdate": undefined,
                "volumechange": updateState,
                "waiting": updateState};

            angular.forEach(events, function (value, key) {
                if (value) {
                    element.addEventListener(key, value, false);
                }
            });

            // position binding - reverse (element to model)
            function audioElementPositionRAF() {
                rafOn = true;
                if (attributes.ngAudio) {
                    var target = scope.$eval(attributes.ngAudio);
                    if (target) {
                        var position = element.currentTime;
                        if (target.position != position) {
                            //scope.$safeApply2(function () {
                            target.position = position;
                            //});

                            lastRafPosition = position;

                            // trialing $digest, it is slightly faster than $watch and
                            // we don"t need all the logic of $watch
                            if (!scope.$$phase) {
                                scope.$digest();
                            }
                        }
                    }
                }

                // optimisation - do not request a new frame if element is paused
                // requires loop to be restarted on play event
                if (element.paused) {
                    rafOn = false;
                    return;
                }

                // need to request each new frame
                window.requestAnimationFrame(audioElementPositionRAF);
            }

            // initialise
            audioElementPositionRAF();

        }
    };
}]);
