const jobNewControllerSymbol = Symbol("JobNewControllerPrivates");

class JobNewController {
    constructor($scope, $routeParams, $timeout, $location, paths, growl,
                AnalysisJobService, AnalysisJobModel, ScriptService, SavedSearchService, MimeType) {
        this[jobNewControllerSymbol] = {};
        let privates = this[jobNewControllerSymbol];

        let controller = this;

        this.jobListPath = paths.site.ngRoutes.analysisJobs.listAbsolute;

        privates.newSavedSearch = false;
        privates.$scope = $scope;
        privates.$timeout = $timeout;
        privates.$scope.newAnalysisJobForm = null;
        privates.AnalysisJobService = AnalysisJobService;
        privates.growl = growl;
        privates.$location = $location;

        // the new analysis job we are making
        this.analysisJob = new AnalysisJobModel();

        // the available scripts
        this.scripts = null;

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

    submitAnalysisJob(form) {
        var analysisJob = this.analysisJob;
        console.info("submitAnalysisJob: ", analysisJob);
        if (!form.$valid) {
            console.warn("Form invalid, not submitting");
            return;
        }

        form.submitting = true;

        // TODO: redirect
        // TODO: deal with validation errors!

        this[jobNewControllerSymbol].AnalysisJobService
            .saveWithSavedSearch(analysisJob)
            .then((response) => {
                var analysisJob = response.data.data[0];
                console.log("Submit success, navigating to details...", analysisJob);
                this[jobNewControllerSymbol].$location.path(analysisJob.viewUrl);
            })
            .catch((response) => {
                // TODO: generalize this
                var handled = false;
                if (response.data.meta.error) {
                    handled = this.processRailsValidations(response.data.meta.error, analysisJob);

                    // custom form extension from directives/ngForm.js
                    form.$validateChildren();
                }

                var message = "Creating analysis job failed" + (handled ? ", please check the form" : "and we don't know why - please let us know");
                console.error(message, response);
                this[jobNewControllerSymbol].growl.error(message);


            })
            .finally(() => {
                form.submitting = false;
            });

    }

    processRailsValidations(error, analysisJob) {
        if (error.info && error.info.name) {
            analysisJob.validations.name.taken.push(analysisJob.name);
            return true;
        }

        return false;
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
            "$location",
            "conf.paths",
            "growl",
            "AnalysisJob",
            "baw.models.AnalysisJob",
            "Script",
            "SavedSearch",
            "MimeType",
            JobNewController
        ]);

