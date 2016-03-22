

class FileListController {
    constructor($scope, $routeParams) {


        //let controller = this;
        
        this.analysisJob = {name: "Test analysis job"};
    }
}

angular
    .module("bawApp.analysisResults.fileList", [])
    .controller(
        "FileListController",
        [
            "$scope",
            "$routeParams",
            FileListController
        ]);

