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





            }],
        bindings: {

            // example annotations of this event-type
            // in the form [{annotationId:123},{annotationId:456}, ... ]
            examples: "=examples",

            // tags that this event type are associated with
            tags: "=tags",

            // the label for this thumb
            label: "=label",

            // whether this thumb is currently selected
            selected: "=selected"
        }
    });