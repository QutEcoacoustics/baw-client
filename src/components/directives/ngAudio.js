var ngAudio = ngAudio || angular.module('bawApp.directives.ngAudio', ['bawApp.configuration']);


ngAudio.constant("ngAudioEvents", {
    volumeChanged: "ngAudio:volumeChanged",
    muteChanged: "ngAudio:muted"
});

/**
 * A directive for binding the model to data off an audio element.
 * Most things are oneway bindings
 *
 * This directive is incomplete. The potential exists for many other cool bindings,
 * like a "isBuffering" binding.
 */
ngAudio.directive("ngAudio", ["ngAudioEvents", "$parse", function (ngAudioEvents, $parse) {
    return {
        restrict: 'A',
        link: function (scope, elements, attributes, controller) {
            var element = elements[0];
            if (element.nodeName !== "AUDIO") {
                throw 'Cannot put ngAudio element on an element that is not a <audio />';
            }

            var expression = $parse(attributes.ngAudio),
                model = expression(scope);

            /* Forward binding */

            function play() {
                element.play();
            }

            function pause() {
                element.pause();
            }

            function toStart() {
                element.currentTime = 0;
            }

            scope.$watch(function () {
                return model.volume;
            }, function (newValue, oldValue) {
                element.volume = newValue;
            });

            /* Reverse binding */

            var propertiesToUpdate = ['duration', 'src', 'currentSrc'];
            function updateObject(src, dest) {
                for (var i = 0; i < propertiesToUpdate.length; i++) {
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

                        if (target.volume != null && target.volume !== element.volume) {
                            target.volume = element.volume;
                            scope.$emit(ngAudioEvents.volumeChanged, element.volume);
                        }

                        if (target.muted != null && target.muted !== element.muted) {
                            target.muted = element.muted;
                            scope.$emit(ngAudioEvents.muteChanged, element.muted);
                        }

                        updateObject(element, target);
                    }
                    else {
                        scope.currentState = event && event.type || 'unknown';
                        updateObject(element, scope);
                    }
                });
            }

            // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Events/Media_events
            var events = {
                'abort': undefined,
                'canplay': undefined,
                'canplaythrough': undefined,
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
                'playing': function (event) {
                    // restart request animation frame
                    audioElementPositionRAF();
                    updateState(event);
                },
                'progress': undefined,
                'ratechange': undefined,
                'seeked': undefined,
                'seeking': undefined,
                'suspend': undefined,
                'timeupdate': undefined,
                'volumechange': updateState,
                'waiting': undefined};

            angular.forEach(events, function (value, key) {
                if (value) {
                    element.addEventListener(key, value, false);

                    // initialise first time
                    value();
                }
            });

            // position binding - reverse (element to model)
            // TODO: we can optimise this, it does not always need to be running
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
