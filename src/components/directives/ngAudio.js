var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);

/**
 * A directive for binding the model to data off an audio element.
 * Most things are oneway bindings
 *
 * This directive is incomplete. The potential exists for many other cool bindings,
 * like a "isBuffering" binding.
 */
bawds.directive('ngAudio', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, elements, attributes, controller) {
            var element = elements[0];
            if (element.nodeName !== "AUDIO") {
                throw 'Cannot put ngAudio element on an element that is not a <audio />';
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

            var propertiesToUpdate = ['duration', 'src', 'currentSrc', 'volume'];
            function updateObject(src, dest) {
                for (var i = 0; i < propertiesToUpdate.length; i++){
                    dest[propertiesToUpdate[i]] = src[propertiesToUpdate[i]];
                }
            }

            function updateState(event) {
                scope.$safeApply2(function () {
                    if (attributes.ngAudio) {
                        var expression = $parse(attributes.ngAudio);
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
                        return;

                    }
                    scope.currentState = event && event.type || 'unknown';
                    updateObject(element, scope);
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
                'playing': updateState,
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
    };
}]);