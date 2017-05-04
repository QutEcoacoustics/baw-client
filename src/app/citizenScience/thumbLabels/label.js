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

                $scope.toggleSelected = function () {
                    var newVal = !self.showInfo;
                    self.onToggleShowInfo(self.labelNum);
                    self.showInfo = newVal;
                };

            }],
        bindings: {

            // tags that this event type are associated with
            tags: "=tags",

            // the label for this thumb (friendly name for label)
            name: "=",

            labelNum: "<",

            // whether this thumb is currently selected for more info
            showInfo: "=",

            onToggleShowInfo: "<"

        }
    });