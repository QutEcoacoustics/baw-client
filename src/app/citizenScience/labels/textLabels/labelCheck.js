angular.module("bawApp.components.citizenScienceLabelCheck", ["bawApp.citizenScience.common"])
    .component("labelCheck", {
        templateUrl: "citizenScience/labels/textLabels/labelCheck.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                var self = this;

                /**
                 * There are 4 possible states for the label, yes, no, maybe and empty.
                 * Empty a bit like no. With no, it's been explicitly set as no,
                 * whereas with empty it is the default state, not yet explicitly set. Once the state is changed from
                 * empty it can never be empty again.
                 * There are two view variations for this: expanded or not
                 * With expanded, the label will have 'yes', 'no' and 'maybe' checkboxes separately
                 * With not expanded, there is one checkbox that cycles between yes, maybe and no
                 */

                /**
                 * change the state for this label.
                 * @param state string.
                 * If state is supplied, it will set the state to be the value supplied. If it is already
                 * the state supplied, it will not have any effect.
                 * If state is not supplied, it will cycle through the possible states.
                 */
                $scope.toggleLabel = function (stateIndex) {

                    console.log(self.state);

                    if (typeof stateIndex !== "number") {
                        // no new stateIndex supplied so cycle through the states, excluding zero
                        stateIndex = ($scope.stateIndex + 1);
                        if (stateIndex > $scope.states.length - 1) {
                            stateIndex = $scope.stateIndexes[0];
                        }
                    }

                    if (stateIndex === $scope.stateIndex) {
                            // state is unchanged
                            return;
                    }

                    // the state is preserved by storing the stateIndex
                    $scope.stateIndex = stateIndex;

                    // the onToggleSelected function expects a state string
                    if (typeof self.onToggleSelected === "function") {
                        self.onToggleSelected($scope.states[stateIndex]);
                    }

                };

                // TODO: generalise by moving this to bindings?
                $scope.states = ["empty", "yes", "maybe", "no"];
                // The text that appears next to the box
                $scope.labelValueTexts = ["", "yes", "maybe", "no"];
                // possible indexes that the user can choose
                $scope.stateIndexes = [1,2,3];


                $scope.$watch(function () {
                    return self.state;
                    }, function (newVal, oldVal) {

                    if (typeof self.state === "undefined" || $scope.states.indexOf(self.state) === -1) {
                        // default to initialise to empty
                        self.state = "empty";
                    }
                    $scope.stateIndex = $scope.states.indexOf(self.state);

                });


                // whether it shows all three options at once to click like buttons
                // or whether it shows the current state only and cycles through
                $scope.expanded = self.expanded;

            }],

        bindings: {
            onToggleSelected: "=",
            state: "<",
            text:"<",
            expanded: "<",
            showStateText: "<"
        }
    });