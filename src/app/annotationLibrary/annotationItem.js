angular.module("bawApp.components.annotationItem", [])
    .component("annotationItem", {
        templateUrl: "annotationLibrary/annotationItem.tpl.html",
        controller: [
            "$scope",
            "$http",
            function ($scope, $http) {

                var controllerSelf = this;
                console.log(controllerSelf);




                this.audioElement = {
                     volume: 1,
                     muted: false,
                     autoPlay: true,
                     position: 0
                };



            }],
        bindings: {
            annotation: "=annotation",
        }
    });