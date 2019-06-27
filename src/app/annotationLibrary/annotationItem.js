angular.module("bawApp.components.annotationItem", [])
    .component("annotationItem", {
        templateUrl: "annotationLibrary/annotationItem.tpl.html",
        controller: [
            "$scope",
            function ($scope) {

                this.audioElement = {
                     volume: 1,
                     position: 0
                };

                $scope.showDownload = this.download === undefined ? true : this.download;
                $scope.miniVolume = this.miniVolume === undefined ? false : this.miniVolume;


            }],
        bindings: {
            annotation: "=annotation",
            download: "<",
            miniVolume: "<"
        }
    });