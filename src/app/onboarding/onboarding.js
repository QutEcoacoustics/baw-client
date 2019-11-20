/**
 * Wrapper for the angular-introjs directive with info-button, adding functionality:
 * - consistent styling
 * - onBeforeStart callback
 * - add multiple callback functions for each event.
 * - remembering whether it has been viewed before, so we can know whether to autoplay
 * - autoplaying only when the elements are ready
 *
 * There are two parts: 1) The service, which is responsible for storing the steps, remembering what has been viewed, and
 * determining if the elements are ready. Different components add steps and interact with the service to manipulate the state
 * 2) the component. This is a thin wrapper for the ngIntro module,
 *
 */

angular.module("bawApp.components.onboarding", ["bawApp.citizenScience.common", "angular-intro"])
    .factory("onboardingService", ["$timeout",
        function ($timeout) {

            var self = this;



            /**
             * Steps can be given an order property, which we sort by.
             * This allows steps to be added in any order
             */
            self.sortSteps = function () {

                self.steps = self.steps.sort((a,b) => {
                    if (!a.hasOwnProperty("order") || !b.hasOwnProperty("order")) {
                        return 0;
                    } else if (a.order > b.order) {
                        return 1;
                    } else if (b.order > a.order) {
                        return -1;
                    }
                    return 0;
                });

            };

            // an set of the intro text for items that have been seen
            // for debugging, to clear: localStorage.setItem("introItemsViewed", JSON.stringify({}));
            self.viewedItems = localStorage.getItem("introItemsViewed");
            if (self.viewedItems) {
                try {
                    self.viewedItems = JSON.parse(self.viewedItems);
                } catch (e) {
                    self.viewedItems = {};
                }
            } else {
                self.viewedItems = {};
            }

            /**
             * allow the component to register when a step has been made, so that we can record it and only
             * autoplay the first time. Updates the viewedItems to put the key as the selector and the value as the current date.
             * @param whichSteps mixed. Either the step number to register, or an array of step numbers or "all" (default)
             * to register all steps.
             */
            self.registerViewed = function hasViewed (whichSteps = "all") {
                if (whichSteps === "all") {
                    self.steps.forEach(step => {
                        self.viewedItems[step.element] = new Date();
                    });
                } else {
                    if (!Array.isArray(whichSteps)) {
                        whichSteps = [whichSteps];
                    }
                    whichSteps.forEach(whichStep => {
                        self.viewedItems[self.steps[whichStep].element] = new Date();
                    });
                }
                localStorage.setItem("introItemsViewed", JSON.stringify(self.viewedItems));
            };

            self.hasViewedAll = function (withinHours = 24 * 30) {
                return self.steps.every(step => self.viewedItems.hasOwnProperty(step.element) && new Date() - new Date(self.viewedItems[step.element]) < 3600000 * withinHours);
            };

            /**
             * Registers a key that must be received in the 'ready' function for onboarding to be considered ready
             * @param readyKey optional. If omitted and there are no needed keys, isReady will be set to true after a short timeout.
             *
             */
            self.waitFor = function (readyKey) {
                if (readyKey) {
                    self.readyKeys.needed.add(readyKey.toLowerCase());
                    self.isReady = false;
                }
                $timeout.cancel(self.readyTimeout);
                if (!self.readyKeys.needed.length) {
                    self.readyTimeout = $timeout(function () {
                        self.updateIsReady();
                    }, 1000);
                }
            };

            self.updateIsReady = function () {
                self.isReady = Array.from(self.readyKeys.needed).every(key => self.readyKeys.ready.has(key));
            };


            self.callbacks = {};

            /**
             * Clears out the steps, callbacks, readyKeys
             */
            self.init = function () {

                /**
                 * Holds the steps that will be passed to intro.js
                 */
                self.steps = [];

                // callbacks is exposed directly, so we can't assign a new empty object
                Object.keys(self.callbacks).forEach(function(key) { delete self.callbacks[key]; });

                /**
                 * To ensure the autoPlay starts only when all the elements are ready, when steps are added they can provide
                 * a key which is added to the needed set. When certain elements have finished loading (typically after http
                 * success) it can add to the ready set. Onboarding will be considered ready when needed is a subset of ready.
                 * @type {{needed: Set, received: Set}}
                 */
                self.readyKeys = {
                    needed: new Set(),
                    ready: new Set()
                };

                // will switch to true when the needed keys have been added and match the ready keys
                self.isReady = false;
                self.readyTimeout = null;

            };

            return {

                /**
                 *
                 * @param steps Array
                 * @param readyKey String. Onboarding will not have a ready state until this readyMessage has been received
                 */
                addSteps: function (steps, readyKey = null) {

                    if (!Array.isArray(steps)) {
                        steps = [steps];
                    }

                    // filter out steps whose 'element' string is already present in an existing step.
                    var newSteps = steps.filter(x => self.steps.findIndex((s) => s.element === x.element) === -1);
                    self.steps = self.steps.concat(newSteps);
                    self.sortSteps();
                    self.waitFor(readyKey);

                },

                init: self.init,

                getSteps: function () {
                    return self.steps;
                },

                /**
                 * Add callbacks.
                 * @param callbacks
                 * @param add boolean; if false, if a callback with the same key already
                 * exists it will be replaced. If true, will add to a list of callbacks to be executed.
                 */
                addCallbacks: function (callbacks, add = true) {
                    if (add) {
                        Object.keys(callbacks).forEach(callback => {
                            // if there is already a callback function, nest the old and new in a new function.
                            if (add && self.callbacks.hasOwnProperty(callback)) {
                                self.callbacks[callback].push(callbacks[callback]);
                            } else {
                                self.callbacks[callback] = [callbacks[callback]];
                            }
                        });
                    }
                },

                callbacks: self.callbacks,
                registerViewed: self.registerViewed,
                hasViewedAll: self.hasViewedAll,

                /**
                 * Called after the response is received from a request that onboarding depends on
                 * @param key string. Matches what was declared as "needed" when onboarding steps were added
                 */
                ready: function (key) {
                    self.readyKeys.ready.add(key.toLowerCase());
                    // check if all needed keys are ready
                    // delay it to allow for the 'needed' list to catch up.
                    $timeout(function () {
                        self.updateIsReady();
                    }, 1000);
                },

                waitFor: self.waitFor,

                isReady: function () {
                    return self.isReady;
                }

            };


        }])
    .component("onboarding", {
        templateUrl: "onboarding/infoButton.tpl.html",
        bindings: {
            options: "<"
        },
        controller: [
            "$scope",
            "onboardingService",
            "ngIntroService",
            "$timeout",
            function ($scope, onboardingService, ngIntroService, $timeout) {

                var self = this;

                const statuses = {
                    loading: "loading",
                    ready: "ready",
                    open: "open"
                };

                $scope.status = statuses.loading;

                $scope.launchTour = function launchTour () {

                    self.init();

                    // it does not seem possible to modify the elements in the steps list
                    // after the intro has started. If an intro step include an element that is hidden when
                    // the intro starts, then that step will not display correctly. Dom manipulation must be finished
                    // before the introJS initialises (which is before any introJs callback).
                    if (angular.isArray(onboardingService.callbacks.onBeforeStart)) {

                        // use timeouts to ensure that digest cycles are complete before starting
                        $timeout(() => {
                            for (const onBeforeStartFunction of onboardingService.callbacks.onBeforeStart) {
                                onBeforeStartFunction.call();
                            }
                            $timeout(() => {
                                ngIntroService.start();
                            });
                        });

                    } else {
                        ngIntroService.start();
                    }
                };

                // automatically start the tour if any of the steps have not been seen yet.
                // steps are added to the service by different components. It's hard to know when steps have stopped being
                // added. We check to see if all have been viewed after each addition of steps,
                // and if false launch the tour after a timeout of 1 second. If new steps are added, this timeout gets extended
                // if new steps are added after the 1 second, ... hmm I dunno, maybe we need to cancel and relaunch to ensure those steps are included?

                self.autoplayTimeout = null;
                $scope.$watch(function () {
                    return onboardingService.isReady();
                    }, function (isReady) {
                        if (isReady) {
                            $scope.status = statuses.ready;
                            if (!onboardingService.hasViewedAll()) {
                                ngIntroService.hideHints();
                                $scope.launchTour();
                            }
                        }
                });

                /**
                 * Use the onAfterChange to register that a particular step has been viewed, for the purpose of
                 * autoplaying only if something has not been viewed.
                 */
                onboardingService.addCallbacks({
                    onAfterChange: function (el) {
                        onboardingService.registerViewed(ngIntroService.intro._currentStep);
                    },
                    onExit: function () {
                        onboardingService.registerViewed();
                        self.onClose();
                    },
                    onComplete: function () {
                        self.onClose();
                    }
                });

                self.onClose = function () {
                    $timeout(function () {
                        $scope.status = statuses.ready;
                    }, 1000);
                };

                self.init = function () {

                    $scope.status = statuses.open;

                    // set all the callbacks
                    Object.keys(onboardingService.callbacks).forEach(callback => {
                        // each value is an array of functions, so we wrap them in a function and call each one.
                        if (angular.isFunction(ngIntroService[callback])) {
                            ngIntroService[callback](function (arg) {
                                for (let i = 0; i < onboardingService.callbacks[callback].length; i++) {
                                    onboardingService.callbacks[callback][i](arg);
                                }
                            });
                        }

                    });

                    if (self.options === undefined) {
                        self.options = {};
                    }

                    var options = Object.assign({}, self.introOptionsDefaults, self.options);
                    options.steps = onboardingService.getSteps();
                    ngIntroService.setOptions(options);

                };

                self.introOptionsDefaults = {
                    steps: [],
                    showStepNumbers: false,
                    exitOnOverlayClick: true,
                    exitOnEsc: true,
                    nextLabel: "<strong>NEXT!</strong>",
                    prevLabel: "<span style='color:green'>Previous</span>",
                    skipLabel: "Exit",
                    doneLabel: "Thanks"
                };



            }]
    });
