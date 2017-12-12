angular.module("bawApp.components.annotationItem", [])
    .component("annotationItem", {
        templateUrl: "annotationLibrary/annotationItem.tpl.html",
        controller: [
            "$scope",
            "$http",
            function ($scope, $http) {

                this.audioElement = {
                     volume: 1,
                     position: 0
                };

            }],
        bindings: {
            annotation: "=annotation",
        }
    });