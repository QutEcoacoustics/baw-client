angular
    .module("bawApp.uiHints.capability", [])
    .directive(
        "capabilityModel",
        [
            "$parse",
            function($parse) {
                return {
                    restrict: "EA",
                    multiElement: true,
                    controller: [
                        "$scope",
                        "$element",
                        "$attrs",
                        "baw.models.Capabilities",
                        function CapabilityController(scope, element, attributes, CapabilitiesModel) {
                            const error = "The capability evaluator must return a value, not a function. Have you done `canUpdate` instead of `canUpdate{}`";

                            var controller = this;
                            controller.model = undefined;
                            controller.modelUpdateEvent = "bawApp.uiHints.capability.capabilityModelUpdate";

                            var modifiedLocals = {};

                            // we need root scope because sometimes elements can be transcluded and
                            // the event hierarchy breaks - i think!
                            scope.$watch(attributes.capabilityModel, (newValue) => {
                                if (newValue && !newValue.can) {
                                    throw new Error("The capability-model must have a `can` method.");
                                }

                                controller.model = newValue;

                                modifiedLocals = createCanMethods();

                                scope.$root.$broadcast(controller.modelUpdateEvent, controller.model);
                            });


                            /**
                             * Evaluate all current capabilities, useful for debugging.
                             * @returns {*}
                             */
                            controller.evaluateAllCapabilities = function () {
                                return Object.keys(modifiedLocals).reduce((out, key) => {
                                    // force evaluate getters
                                    out[key] = modifiedLocals[key];
                                    return out;
                                }, {});
                            };

                            controller.createEvaluator = function(expression) {
                                var compiled = $parse(expression);

                                //console.warn("capability evaluator for `" + expression + "`", scope, modifiedLocals);
                                return () => {
                                    let result = compiled(scope, modifiedLocals);
                                    //console.debug("capability evaluation for: `" + expression+ "`", result, controller.evaluateAllCapabilities());
                                    if (typeof result === "function") {
                                        throw new Error(error);
                                    }
                                    return result;
                                };
                            };

                            function createCanMethods() {
                                let methods = {
                                    reason: CapabilitiesModel.reasons
                                };

                                if(controller.model) {
                                    Object.keys(controller.model.meta.capabilities.actions).forEach((key) => {
                                        var can = function (reason) {
                                            return controller.model.can(key, reason);
                                        };

                                        // this is a bit of a hack
                                        // add a property getter for each capability
                                        Object.defineProperty(methods, key, {get: can, enumerable: true});

                                        // and add can methods (neater than the getters)
                                        methods[getCanKey(key)] = can;
                                    });
                                }

                                return methods;
                            }

                            function getCanKey(action) {
                                return "can" + action.charAt(0).toUpperCase() + action.slice(1);
                            }
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
                    attributes.$observe("class", update);


                    function toClasses(result) {
                        let newString = !!result ? capabilityEnabled  : capabilityDisabled;
                        let oldString = !!result ? capabilityDisabled : capabilityEnabled ;

                        return [newString , oldString];
                    }

                    let capability = () => {};
                    function update() {
                         capability = capabilityController.createEvaluator(attributes.capabilityEnabled);
                    }

                    // the function forces the value to be evaluated on every scope iteration (this ensures
                    // capability-enabled matches behaviour of capability-if and also prevents async race conditions
                    scope.$watch(() => {return capability();}, function (newValue) {
                        var [newClasses, oldClasses] = toClasses(newValue);
                        attributes.$updateClass(newClasses, oldClasses);
                    });
                }
            };
        }]
);
