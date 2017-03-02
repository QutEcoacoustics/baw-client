/**
 * Wrapper for the angular-introjs directive with info-button and consistent styling
 */

angular.module("bawApp.components.onboarding", ["bawApp.citizenScience.common"])
    .component("onboarding", {
        templateUrl: "onboarding/infoButton.tpl.html",
        bindings: {
            steps: "=steps",
            options: "=options"
        },
        controller: [
            "$scope",
            function ($scope) {

                //var self = this;

                $scope.CompletedEvent = function (scope) {
                    console.log("Completed Event called");
                };

                $scope.ExitEvent = function (scope) {
                    console.log("Exit Event called");
                };

                $scope.ChangeEvent = function (targetElement, scope) {
                    console.log("Change Event called");
                    console.log(targetElement);  //The target element
                    console.log(this);  //The IntroJS object
                };

                $scope.BeforeChangeEvent = function (targetElement, scope) {
                    console.log("Before Change Event called");
                    console.log(targetElement);
                };

                $scope.AfterChangeEvent = function (targetElement, scope) {
                    console.log("After Change Event called");
                    console.log(targetElement);
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


                $scope.introOptions = Object.assign({}, this.introOptionsDefaults, this.options);

                if (Array.isArray(this.steps)) {

                        this.steps = this.steps.map(function (step) {
                            if (typeof step.element === "string") {
                                step.element = document.querySelector(step.element);
                            }
                            return step;
                        });

                    $scope.introOptions.steps = this.steps;
                }

            }]
    });
