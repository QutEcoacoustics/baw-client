class FileListController {
    constructor($scope, $routeParams, growl, AnalysisJobService, AnalysisResultService) {
        let controller = this;

        this.analysisJob = null;
        this.analysisResult = null;
        $routeParams.path = $routeParams.path || "/";

        // download metadata
        AnalysisJobService
            .getName(Number($routeParams.analysisJobId))
            .then(function (response) {
                controller.analysisJob = response.data.data[0];
                controller.updateCurrentDirectory();
            })
            .catch((error) => {
                console.error("AnalysisJobs::details::error: ", error);
                growl.error(
                    "There was a problem loading this page. Please refresh the page. If you see this message often please let us know.");
            });

        AnalysisResultService
            .get($routeParams.path)
            .then(function (response) {
                controller.analysisResult = response.data.data[0];
                controller.updateCurrentDirectory();
            })
            .catch((error) => {
                console.error("AnalysisJobs::details::error: ", error);
                growl.error(
                    "There was a problem loading this page. Please refresh the page. If you see this message often please let us know.");
            });


        this.currentDirectory = [];

    }

    updateCurrentDirectory() {
        this.currentDirectory = [
            {
                path: !this.analysisJob ? "" : this.analysisJob.viewUrl,
                title: !this.analysisJob ? "" : (this.analysisJob.name.substring(0, 12) + "…")
            },
            {
                path: !this.analysisResult ? "" : this.analysisResult.viewUrl,
                title: "results"
            }
        ];

        let fragments = [];

        if (this.analysisResult) {
            fragments = this
                .analysisResult
                .path
                .split("/")
                .filter(s => s !== "")
                .map((fragment, i, all) => ({path: this.getPath(fragment, i, all), title: fragment}));
        }

        this.currentDirectory = this.currentDirectory.concat(fragments);

    }

    getPath(fragment, i, fragments) {
        return this.analysisJob.resultsUrl + fragments.slice(0, i + 1).join("/");
    }
}

angular
    .module("bawApp.analysisResults.fileList", [])
    .controller(
        "FileListController",
        [
            "$scope",
            "$routeParams",
            "growl",
            "AnalysisJob",
            "AnalysisResult",
            FileListController
        ]);

