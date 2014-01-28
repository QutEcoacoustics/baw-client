var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);

/**
 * A directive for binding the model to data off an audio element.
 * Most things are oneway bindings
 *
 * This directive is incomplete. The potential exists for many other cool bindings,
 * like a "isBuffering" binding.
 */
bawds.directive('ngAudio', ['$parse', function ($parse) {
    /* const */ var readyStates = {
        "haveNothing": 0,
        "haveMetadata": 1,
        "haveCurrentData": 2,
        "haveFutureData": 3,
        "haveEnoughData": 4
    };

    return {
        restrict: 'A',
        link: function (scope, elements, attributes, controller) {
            var element = elements[0];
            if (element.nodeName !== "AUDIO") {
                throw 'Cannot put ngAudio element on an element that is not a <audio />';
            }

            var expression = $parse(attributes.ngAudio);

            /*
             * FORWARD BINDING
             *
             * NOTE: only some properties are bound forward
             */

            // volume
            scope.$watch(function() {
                var target = expression(scope);
                return target ? target.volume : null;
            }, function updateVolume(newValue, oldValue) {
               element.volume = newValue;
            });

            // muted
            scope.$watch(function() {
                var target = expression(scope);
                return target ? target.muted : null;
            }, function updateMuted(newValue, oldValue) {
                element.muted = !!newValue;
            });


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

            var propertiesToUpdate = ['duration', 'src', 'currentSrc', 'volume', 'muted'];
            function updateObject(src, dest) {
                for (var i = 0; i < propertiesToUpdate.length; i++){
                    dest[propertiesToUpdate[i]] = src[propertiesToUpdate[i]];
                }
            }

            function updateState(event) {
                scope.$safeApply2(function () {
                    if (attributes.ngAudio) {
                        var target = expression(scope);
                        if (!target) {
                            expression.assign(scope, {});
                            target = expression(scope);
                        }

                        target.play = target.play || play;
                        target.pause = target.pause || pause;
                        target.toStart = target.toStart || toStart;

                        target.currentState = event && event.type || 'unknown';

                        updateObject(element ,target);

                        target.isPlaying = event && event.type === "playing";

                        target.canPlay = element.readyState >= readyStates.haveFutureData;

                        return;

                    }
                    scope.currentState = event && event.type || 'unknown';
                    updateObject(element, scope);
                });
            }

            // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Events/Media_events
            var events = {
                'abort': undefined,
                'canplay': updateState,
                'canplaythrough': updateState,,
                // TODO: why does this event need a special handler?
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
                'emptied': updateState,
                'ended': updateState,
                'error': undefined,
                'loadeddata': updateState,
                'loadedmetadata': updateState,
                'loadstart': updateState,
                'mozaudioavailable': undefined,
                'pause': updateState,
                'play': updateState,
                'playing': function(event) {
                    // restart request animation frame
                    audioElementPositionRAF();
                    updateState(event);
                },
                'progress': updateState,
                'ratechange': undefined,
                'seeked': updateState,
                'seeking': updateState,
                'suspend': updateState,
                'timeupdate': undefined,
                'volumechange': updateState,
                'waiting': updateState};

            angular.forEach(events, function (value, key) {
                if (value) {
                    element.addEventListener(key, value, false);

                    // initialise first time
                    value();
                }
            });

            // position binding - reverse (element to model)
            function audioElementPositionRAF() {
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

                // optimisation - do not request a new frame if element is paused
                // requires loop to be restarted on play event
                if (element.paused) {
                    return;
                }

                // need to request each new frame
                window.requestAnimationFrame(audioElementPositionRAF);
            }

        }
    };
}]);
