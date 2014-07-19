/**
 * A toggle switch control based off
 * https://github.com/cgarvis/angular-toggle-switch/blob/master/angular-toggle-switch.js
 */
angular.module("bawApp.directives.toggleSwitch", ["ng"])
    .directive("toggleSwitchState", function() {
        return {
            restrict: "EAC",
            link: function($scope, element, attributes, controller) {
                console.debug("switch state:link function:", $scope.$id, arguments);
            }
        };
    })
    .directive("toggleSwitch", ["$timeout", function (timer) {

        return {
            restrict: "E",
            scope: {
                model: "=",
                disabled: "=disabled",
                mode: "@?"
            },
            templateUrl: "components/directives/baw-toggle/bawToggleTemplate.tpl.html",
            transclude: true,
            link: function linkFunction($scope, $element, attributes, controller, transcludeFunction) {

                console.debug("link function:", $scope.$id);

                var element = $element[0],
                    onDiv = element.querySelector(".toggle-switch-on"),
                    offDiv = element.querySelector(".toggle-switch-off"),
                    knobDiv = element.querySelector(".toggle-switch-knob");

                transcludeFunction($scope, function (clone) {
                    console.debug("transclude function:", arguments);

                    // we could filter for elements that are toggle-switch-state
                    // but it is easier to just detect the attribute - it's really the only
                    // information that is needed.
                    clone.toArray().forEach(function (value, index) {

                        if (value.nodeType !== (Node.ELEMENT_NODE || 1)) {
                            return;
                        }

                        var switchState;
                        if (value.hasAttribute("switch-state")) {
                            switchState = value.getAttribute("switch-state");
                        }
                        else if (value.hasAttribute("toggle-switch-state")) {
                            switchState = value.getAttribute("toggle-switch-state");
                        }

                        if (switchState === "on") {
                            onDiv.appendChild(value);
                        }
                        else if (switchState === "off") {
                            offDiv.appendChild(value);
                        }
                        else if (switchState === "knob") {
                            knobDiv.appendChild(value);
                        }
                    });
                });


                if (onDiv.innerHTML === "") {
                    onDiv.innerText = "On";
                }
                if (offDiv.innerHTML === "") {
                    offDiv.innerText = "Off";
                }
                if (knobDiv.innerHTML === "") {
                    knobDiv.innerText = " ";
                }

                // after load enable animations
                timer(function() {
                    element.classList.add("toggle-switch-animate");
                }, 0);
            },
            controller: function($scope, $element, $attrs) {

                console.debug("controller function", $scope.$id);

                $scope.disabled = $scope.disabled || false;
                $scope.modeNormalized = $scope.mode == "push-toggle" ? "push-toggle" : "slide-toggle";

                $scope.toggle = function toggle() {
                    if (!$scope.disabled) {
                        $scope.model = !$scope.model;
                    }
                };
            }
        };
    }]);