angular.module("bawApp.components.citizenScienceThumbLabels.label",
    [
        "bawApp.components.citizenScienceThumbLabels.examples",
        "bawApp.citizenScience.sampleLabels"
    ])
    .component("citizenScienceThumbLabel", {
        templateUrl: "citizenScience/labels/thumbLabels/label.tpl.html",
        controller: [
            "$scope",
            "SampleLabels",
            function ($scope, SampleLabels) {

                /**
                 * A label "state" means it's response state e.g. yes, no, maybe, empty
                 * A label is "active" if it has been clicked to show details
                 */

                var self = this;

                /**
                 * Gets the state of this label from the SampleLabels service
                 * @return {string}
                 */
                $scope.currentState = function() {
                    return SampleLabels.getValue(self.label.id);
                };

                /**
                 * Gets whether the details (example etc) are being shown for this label
                 * @return {boolean}
                 */
                $scope.isShowingDetails = function () {
                    return self.currentDetailsLabelId.value === self.label.id;
                };


                /**
                 * Returns the label text that will be shown on top of the thumbnail on hover.
                 * Truncates the label if it is too long to fit in roughly 3 lines.
                 */
                self.thumbLabelText = function () {

                    var commonParameters = self.label.examples[0].annotation.media.commonParameters;

                    // very rough linear relationship between duration and how many characters fit in 3 lines.
                    // depends on word length. Determined by trial and error.
                    var maxChars = 7.1 * (commonParameters.endOffset - commonParameters.startOffset);

                    var labelText = self.label.name;

                    if (maxChars < labelText.length - 3) {
                        labelText = labelText.substring(0, maxChars - 3);
                        labelText = labelText + "...";
                    }

                    return labelText;

                };


                $scope.$watch(function () {
                    return (self.label.examples[0].hasOwnProperty("annotation"));
                }, function (newVal) {
                    if (newVal) {
                        $scope.thumbLabelText = self.thumbLabelText();
                    }
                });


                $scope.thumbLabelText = self.label.name;

                /**
                 * toggles whether the details pane is showing for the current label
                 */
                $scope.toggleShowDetails = function () {
                    if ($scope.isShowingDetails()) {
                        self.currentDetailsLabelId.value = -1;
                    } else {
                        self.currentDetailsLabelId.value = self.label.id;
                    }
                    console.log("showing details for label:", self.currentDetailsLabelId.value);

                };

                /**
                 * callback when this label state changes
                 * This is a bit convoluted but the alternative is to nest the state
                 * in an object and update by reference
                 * and watch the object to update the SampleLabels service.
                 * @param isSelected Boolean
                 */
                self.onToggleSelected = function (state) {
                    SampleLabels.setValue(state, self.label.id);
                    $scope.state = state;
                };



            }],
        bindings: {

            label: "=",
            currentDetailsLabelId: "="

        }
    });