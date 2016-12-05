angular.module("bawApp.components.annotationItem", [])
    .component("annotationItem", {
        templateUrl: "annotationLibrary/annotationItem.tpl.html",
        controller: [
            "$scope",
            "$http",
            function ($scope, $http) {

                var self = this;
                console.log(self);



            }],
        bindings: {
            labels: "=annotation",
        }
    });