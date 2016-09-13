const jobNewControllerSymbol = Symbol("JobNewControllerPrivates");

class JobNewController {
    constructor($scope, $routeParams, $timeout, paths, AnalysisJobService, AnalysisJobModel, ScriptService, MimeType) {
        this[jobNewControllerSymbol] = {};
        let privates = this[jobNewControllerSymbol];
        
        let controller = this;

        this.jobListPath = paths.site.ngRoutes.analysisJobs.list;
        
        privates.newSavedSearch = false;
        privates.$scope = $scope;
        privates.$timeout = $timeout;
        privates.$scope.newAnalysisJobForm = null;

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
            onLoad: (editor) => this.aceLoaded(editor),
            onChange: this.aceChanged
        };

        $scope.$watch(
            () => this.analysisJob.scriptId,
            (newValue) => {
                if (newValue === null || newValue === undefined) {
                    return;
                }

                let currentScript = this.scripts.find(x => x.id === newValue);
                this.analysisJob.customSettings = currentScript.executableSettings;
                this.analysisJob.script = currentScript;

                let mode = MimeType.mimeToMode(currentScript.executableSettingsMediaType);
                this[jobNewControllerSymbol].aceInstance.setMode("ace/mode/" + mode);
            }
        );

        $scope.$watch(
            () => this.analysisJob.selectedSavedSearch,
            (newValue) => {
                if (newValue === null || newValue === undefined) {
                    this.analysisJob.savedSearchId = null;

                }
                else {
                    this.analysisJob.savedSearchId = newValue.id;
                }
            }
        );
    }

    aceLoaded(editor) {
        this[jobNewControllerSymbol].aceInstance = editor.getSession();

        this[jobNewControllerSymbol].aceInstance.setUseSoftTabs(true);

        editor.maxLines = Infinity;

        // This is to remove following warning message on console:
        // Automatically scrolling cursor into view after selection change this will be disabled in the next
        // version set editor.$blockScrolling = Infinity to disable this message
        editor.$blockScrolling = Infinity;
    }

    aceChanged() {

    }

    get isCreatingNewSavedSearch() {
        return this[jobNewControllerSymbol].isCreatingNewSavedSearch;
    }

    set isCreatingNewSavedSearch(value) {
        let p = this[jobNewControllerSymbol];

        p.isCreatingNewSavedSearch = value;

        p.newSavedSearch = value;
        this.selectedSavedSearch = null;

        // this hack fixes: after form has been submitted, user chooses, new saved search,
        // form fields are pristine.
        if (p.$scope.newAnalysisJobForm.$invalid && p.$scope.newAnalysisJobForm.$submitted) {
            p.$timeout(() => p.$scope.$broadcast("$submitted"));
        }
    }

    get selectedSavedSearch() {
        return this.analysisJob.savedSearch;
    }

    set selectedSavedSearch(value) {
        this.analysisJob.savedSearch = value;
    }


    scriptSelect(id) {
        this.analysisJob.scriptId = id;
    }

    submitAnalysisJob() {
        console.info("submitAnalysisJob: ", this.analysisJob);


    }
}

angular
    .module("bawApp.jobs.new", [])
    .controller(
        "JobNewController",
        [
            "$scope",
            "$routeParams",
            "$timeout",
            "conf.paths",
            "AnalysisJob",
            "baw.models.AnalysisJob",
            "Script",
            "MimeType",
            JobNewController
        ]);

