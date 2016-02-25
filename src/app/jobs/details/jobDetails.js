class JobDetailsController {
    constructor($scope, $routeParams, $http, ActiveResource, AnalysisJobService) {
        let controller = this;

        this.isNew = $routeParams.new;

        this.random2 = Math.random() + 2;

        AnalysisJobService
            .get(Number($routeParams.analysisJobId))
            .then(function (response) {
                controller.analysisJob = response.data.data[0];
                ActiveResource.set(controller.analysisJob);
            });


        this.aceConfig = {
            useWrapMode: true,
            showGutter: true,
            theme: "xcode",
            mode: "yaml",
            firstLineNumber: 1,
            onLoad: function (editor) {
                editor.renderer.$cursorLayer.element.style.display = "none";

                editor.getSession().setUseSoftTabs(true);
                // This is to remove following warning message on console:
                // Automatically scrolling cursor into view after selection change this will be disabled in the next
                // version set editor.$blockScrolling = Infinity to disable this message
                editor.$blockScrolling = Infinity;
            },
            onChange: controller.aceChanged
        };
    }
}

angular
    .module("bawApp.jobs.details", [])
    .controller(
        "JobDetailsController",
        [
            "$scope",
            "$routeParams",
            "$http",
            "ActiveResource",
            "AnalysisJob",
            JobDetailsController
        ]);

