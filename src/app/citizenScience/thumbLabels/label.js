angular.module("bawApp.components.citizenScienceThumbLabels.label",
    [
        "bawApp.components.citizenScienceThumbLabels.examples"
    ])
    .component("citizenScienceLabel", {
        templateUrl: "citizenScience/thumbLabels/label.tpl.html",
        controller: [
            "$scope",
            "$http",
            "CitizenScienceCommon",
            "annotationLibraryCommon",
            "AudioEvent",
            "baw.models.AudioEvent",
            function ($scope, $http, CitizenScienceCommon, libraryCommon, AudioEventService, AudioEvent) {

                var self = this;

                $scope.selected = false;



                $scope.toggleSelected = function () {

                    console.log("toggling state for label number", self.labelNum);

                    //$scope.selected = self.onToggleSelected(self.labelNum);

                    if (self.selectedLabelNum.value === self.labelNum) {
                        self.selectedLabelNum.value = -1;
                        $scope.selected = false;
                    } else {
                        self.selectedLabelNum.value = self.labelNum;
                        $scope.selected = true;
                    }

                };

            }],
        bindings: {

            // tags that this event type are associated with
            tags: "=",

            // the label for this thumb (friendly name for label)
            name: "=",

            examples: "<",

            labelNum: "<",

            onToggleSelected: "<",

            selectedLabelNum: "="


        }
    });