class JobNewController {
    constructor($scope, $routeParams, AnalysisJobService, AnalysisJobModel, ScriptService) {
        let controller = this;

        this.random2 = Math.random() + 2;

        // the new analysis job we are making
        this.analysisJob = new AnalysisJobModel();


        // the available scripts
        this.scripts = [];

        // download available scripts
        ScriptService
            .query()
            .then(function (response) {
                controller.scripts = response.data.data;
            });


        this.aceConfig = {
            useWrapMode: true,
            showGutter: true,
            theme: "xcode",
            mode: "yaml",
            firstLineNumber: 1,
            onLoad: this.aceLoaded,
            onChange: this.aceChanged
        };

        $scope.$watch(
            () => this.analysisJob.scriptId,
            (newValue) => {
                if (newValue === null || newValue === undefined) {
                    return;
                }

                this.analysisJob.customSettings =
                    this.scripts.find(x => x.id === newValue).executableSettings;
            }
        );


    }

    aceLoaded(editor) {
        editor.getSession().setUseSoftTabs(true);

        editor.maxLines = Infinity;

        // This is to remove following warning message on console:
        // Automatically scrolling cursor into view after selection change this will be disabled in the next
        // version set editor.$blockScrolling = Infinity to disable this message
        editor.$blockScrolling = Infinity;
    }

    aceChanged() {

    }

    scriptSelect(id) {
        this.analysisJob.scriptId = id;
    }

    submitAnalysisJob() {
        console.info("submitAnalysisJob: ", this.analysisJob);
    }

    debug() {
        console.info("debug: ", this.analysisJob);
    }
}

angular
    .module("bawApp.jobs.new", [])
    .controller(
        "JobNewController",
        [
            "$scope",
            "$routeParams",
            "AnalysisJob",
            "baw.models.AnalysisJob",
            "Script",
            JobNewController
        ]);

