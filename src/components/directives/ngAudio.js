var bawds = bawds || angular.module('bawApp.directives', ['bawApp.configuration']);

/**
 * A directive for binding the model to data off an audio element.
 * Most things are oneway bindings
 */
bawds.directive('ngAudio', ['$parse', function ($parse) {

    return {
        restrict: 'A',
        link: function (scope, elements, attributes, controller) {
            var element = elements[0];
            if (element.nodeName !== "AUDIO") {
                throw 'Cannot put ngAudio element on an element that is not a <audio />';
            }

            function setCurrentState(event) {
                scope.$safeApply2(function () {
                    if (attributes.ngAudio) {
                        var expression = $parse(attributes.ngAudio);
                        var target = expression(scope);
                        if (!target) {
                            expression.assign(scope, {});
                            target = expression(scope);
                        }

                        target.currentState = event && event.type || 'unknown';
                        return;

                    }
                    scope.currentState = event && event.type || 'unknown';
                });
            }

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
                'emptied': undefined,
                'ended': setCurrentState,
                'error': undefined,
                'loadeddata': undefined,
                'loadedmetadata': undefined,
                'loadstart': undefined,
                'mozaudioavailable': undefined,
                'pause': setCurrentState,
                'play': setCurrentState,
                'playing': setCurrentState,
                'progress': undefined,
                'ratechange': undefined,
                'seeked': undefined,
                'seeking': undefined,
                'suspend': undefined,
                'timeupdate': undefined,
                'volumechange': undefined,
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