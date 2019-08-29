/**
 * Wrapper for the angular-introjs directive with info-button, consistent styling, onBeforeStart callback
 */

angular.module("bawApp.components.onboarding", ["bawApp.citizenScience.common", "angular-intro"])
    .factory("onboardingService", [
        function () {

            var self = this;

            self.steps = [];
            self.callbacks = {};

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


            return {

                addSteps: function (steps) {

                    if (!Array.isArray(steps)) {
                        steps = [steps];
                    }

                    // filter out steps whose 'element' string is already present in an existing step.
                    var newSteps = steps.filter(x => self.steps.findIndex((s) => s.element === x.element) === -1);

                    self.steps = self.steps.concat(newSteps);

                },


                getSteps: function () {
                    self.sortSteps();
                    return self.steps;
                },

                /**
                 * Add callbacks. If a callback with the same key already
                 * exists it will be replaced
                 * @param callbacks
                 */
                addCallbacks: function (callbacks) {
                    Object.assign(self.callbacks, callbacks);
                },

                callbacks: self.callbacks

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

                $scope.launchTour = function launchTour () {

                    self.init();

                    // it does not seem possible to modify the elements in the steps list
                    // after the intro has started. If an intro step include an element that is hidden when
                    // the intro starts, then that step will not display correctly. Dom manipulation must be finished
                    // before the introJS initialises (which is before any introJs callback).
                    if (angular.isFunction(onboardingService.callbacks.onBeforeStart)) {

                        // use timeouts to ensure that digest cycles are complete before starting
                        $timeout(() => {
                            onboardingService.callbacks.onBeforeStart.call();
                            $timeout(() => {ngIntroService.start();});
                        });

                    } else {
                        ngIntroService.start();
                    }

                };

                self.init = function () {

                    // set all the callbacks
                    Object.keys(onboardingService.callbacks).forEach((cb) => {
                        if (angular.isFunction(ngIntroService[cb])) {
                            ngIntroService[cb](onboardingService.callbacks[cb]);
                        } else {
                            console.log("no function", cb);
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
