angular
    .module("bawApp.uiHints.capability", [])
    .directive(
        "capabilityModel",
        [
            function() {
                return {
                    restrict: "EA",
                    multiElement: true,
                    controller: [
                        "$scope",
                        "$element",
                        "$attrs",
                        function CapabilityController(scope, element, attributes) {
                            this.model = undefined;
                            this.modelUpdateEvent = "bawApp.uiHints.capability.capabilityModelUpdate";

                            // we need root scope because sometimes elements can be transcluded and
                            // the event hierarchy breaks - i think!
                            scope.$watch(attributes.capabilityModel, (newValue) => {
                                if (newValue && !newValue.can) {
                                    throw new Error("The capability-model must have a `can` method.");
                                }

                                this.model = newValue;
                                scope.$root.$broadcast(this.modelUpdateEvent, this.model);
                            });

                            this.createEvaluator = function(action) {
                                if (this.model) {
                                    var model = this.model;
                                    return function() {
                                        return model.can(action);
                                    };
                                } else {
                                    return () => {};
                                }
                            };
                        }
                    ]
                };
            }
        ])
    /**
     * Using model capabilities, selectively keep or remove elements from the DOM.
     * Best used for removing UI actions that a user does not have access to.
     */
    .directive(
        "capabilityIf",
        [
        "ngIfDirective",
        function(ngIfDirective) {
            // based off http://stackoverflow.com/a/29010910/224512

            var ngIf = ngIfDirective[0];

            return {
                transclude: ngIf.transclude,
                priority: ngIf.priority - 1,
                terminal: ngIf.terminal,
                restrict: "A",
                require: "^capabilityModel",
                link: function (scope, element, attributes, capabilityController) {

                    var initialNgIf,
                        ifEvaluator;

                    scope.$watch(attributes.capabilityIf, update);
                    scope.$on(capabilityController.modelUpdateEvent, update);

                    let capability = () => {};
                    let capabilityWrapper = function() {
                        return capability();
                    };

                    function update() {
                        capability = capabilityController.createEvaluator(attributes.capabilityIf);
                    }

                    // find the initial ng-if attribute
                    initialNgIf = attributes.ngIf;
                    // if it exists, evaluates ngIf && capability
                    if (initialNgIf) {
                        ifEvaluator = function () {
                            return scope.$eval(initialNgIf) && capabilityWrapper();
                        };
                    } else {
                        // if there's no ng-if, process normally
                        ifEvaluator = capabilityWrapper;
                    }
                    attributes.ngIf = ifEvaluator;

                    ngIf.link.apply(ngIf, arguments);
                }
            };
        }])
    /**
     * Using model capabilities, selectively apply the `.capability-enabled` or `capability-disabled` class.
     * Best used for disabling UI actions that use should not be allowed to use at the present time.
     * Can be used for security restricted actions that should be seen, or to disable actions that are invalid
     * for the current state of the model.
     */
    .directive(
    "capabilityEnabled",
    [
        function() {
            var capabilityEnabled = "capability-enabled",
                capabilityDisabled = "capability-disabled";

            return {
                restrict: "A",
                require: "^capabilityModel",
                link: function (scope, element, attributes, capabilityController) {

                    scope.$watch(attributes.capabilityEnabled, update);
                    scope.$on(capabilityController.modelUpdateEvent, update);
                    attributes.$observe("class", function(value) {
                        update(scope.$eval(attributes.capabilityEnabled));
                    });

                    var oldVal;

                    function addClasses(classes) {
                        classes.forEach(attributes.$addClass, attributes);
                    }

                    function toClasses(expression) {
                        // can is defined on the ApiBase class
                        let capability = capabilityController.createEvaluator(expression);

                        var result = capability();
                        if (result) {
                            return [capabilityEnabled];
                        }
                        else {
                            return [capabilityDisabled];
                        }
                    }

                    function update(newVal) {
                        var newClasses = toClasses(newVal || "");
                        if (!oldVal) {
                            addClasses(newClasses);
                        } else if (!angular.equals(newVal,oldVal)) {
                            attributes.$updateClass(newClasses, oldVal);
                        }

                        oldVal = newVal;
                    }
                }
                
            };
        }]
);
