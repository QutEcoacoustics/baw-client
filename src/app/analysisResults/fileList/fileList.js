class FileListController {
    constructor($scope, $location, $routeParams, $url, growl, AnalysisJobService, AnalysisResultService) {
        let controller = this;

        this.analysisJob = null;
        this.analysisResult = null;
        this.paging = undefined;
        this._$location = $location;
        this._$url = $url;

        $routeParams.path = $routeParams.path || "/";
        $routeParams.page = Number($routeParams.page);
        if (isNaN($routeParams.page)) {
            $routeParams.page = undefined;
        }
        

        // download metadata
        let analysisJobId = Number($routeParams.analysisJobId);
        AnalysisJobService
            .getName(analysisJobId)
            .then(function (response) {
                controller.analysisJob = response.data.data[0];
                controller.updateCurrentDirectory();
            })
            .then(() => AnalysisResultService.get(analysisJobId, $routeParams.path, $routeParams.page))
            .then(function (response) {
                controller.analysisResult = response.data.data[0];

                controller.paging = response.data.meta.paging;
                if (controller.paging) {
                    controller.paging.maxPageLinks = 10;
                }

                controller.analysisResult.analysisJob = controller.analysisJob;
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
                path: !this.analysisJob ? "" : this.analysisJob.resultsUrl,
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
        return this.analysisJob.resultsUrl + "/" + fragments.slice(0, i + 1).join("/");
    }

    getPaginationLink(page) {
        return this._$url.formatUri(this._$location.path(), {page});
    }
}

angular
    .module("bawApp.analysisResults.fileList", [])
    .controller(
        "FileListController",
        [
            "$scope",
            "$location",
            "$routeParams",
            "$url",
            "growl",
            "AnalysisJob",
            "AnalysisResult",
            FileListController
        ]);

