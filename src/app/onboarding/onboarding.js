/**
 * Wrapper for the angular-introjs directive with info-button, consistent styling, onBeforeStart callback
 */

angular.module("bawApp.components.onboarding", ["bawApp.citizenScience.common", "angular-intro"])
    .component("onboarding", {
        templateUrl: "onboarding/infoButton.tpl.html",
        bindings: {
            config: "=",
        },
        controller: [
            "$scope",
            "ngIntroService",
            "$timeout",
            function ($scope, ngIntroService, $timeout) {

                var self = this;

                // set all the callbacks

                Object.keys(self.config.callbacks).forEach((cb) => {
                    if (angular.isFunction(ngIntroService[cb])) {
                        ngIntroService[cb](self.config.callbacks[cb]);
                    } else {
                        console.log("no function", cb);
                    }

                });

                $scope.launchTour = function launchTour () {

                  console.log("launchtour");

                    // it does not seem possible to modify the elements in the steps list
                    // after the intro has started. If an intro step include an element that is hidden when
                    // the intro starts, then that step will not display correctly. Dom manipulation must be finished
                    // before the introJS initialises (which is before any introJs callback.
                    if (angular.isFunction(self.config.callbacks.onBeforeStart)) {
                        self.config.callbacks.onBeforeStart.call();
                        $timeout(() => {ngIntroService.start();});
                    } else {
                        ngIntroService.start();
                    }

                };

                this.introOptionsDefaults = {
                    steps: [],
                    showStepNumbers: false,
                    exitOnOverlayClick: true,
                    exitOnEsc: true,
                    nextLabel: "<strong>NEXT!</strong>",
                    prevLabel: "<span style='color:green'>Previous</span>",
                    skipLabel: "Exit",
                    doneLabel: "Thanks"
                };

                var options = Object.assign({}, this.introOptionsDefaults, this.options);
                options.steps = self.config.steps;
                ngIntroService.setOptions(options);

            }]
    });
