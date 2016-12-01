angular
    .module("bawApp.jobs.details", [])
    .controller(
        "JobDetailsController", [
            "JobsCommon",
            "$scope",
            "$routeParams",
            "$http",
            "$timeout",
            "conf.paths",
            "ActiveResource",
            "baw.models.associations",
            "baw.models.AnalysisJob.progressKeys",
            "baw.models.AnalysisJob.progressKeysFriendly",
            "baw.models.AnalysisJob.statusKeys",
            "AnalysisJob",
            "Script",
            "SavedSearch",
            "growl",
            "MimeType",
            function (JobsCommon, ...dependencies) {

                // this whole jig is necessary to allow us to use extends clause.
                // This ugly intersection is the result of using angular DI with
                // ES6 classes.


                class JobDetailsController extends JobsCommon {
                    constructor(
                        $scope, $routeParams, $http, $timeout, paths, ActiveResource, modelAssociations,
                        keys, friendlyKeys, statuses, AnalysisJobService,
                        ScriptService, SavedSearchService, growl, MimeType) {
                        super(keys, friendlyKeys, statuses);
                        let controller = this;
                        const savedSearchLinker = modelAssociations.generateLinker("AnalysisJob", "SavedSearch");
                        const scriptLinker = modelAssociations.generateLinker("AnalysisJob", "Script");

                        this.showResultsRoute = paths.site.ngRoutes.analysisJobs.results;

                        AnalysisJobService
                            .get(Number($routeParams.analysisJobId))
                            .then(function (response) {
                                controller.analysisJob = response.data.data[0];
                                ActiveResource.set(controller.analysisJob);
                                controller.chartData.columns = controller.getData();
                            })
                            .then(() => {
                                return ScriptService.get(this.analysisJob.scriptId);
                            })
                            .then((response) => {
                                let scriptLookup = modelAssociations.arrayToMap(response.data.data);
                                scriptLinker(this.analysisJob, {Script: scriptLookup});

                                let mode = MimeType.mimeToMode(this.analysisJob.script.executableSettingsMediaType);
                                controller.aceInstance.setMode("ace/mode/" + mode);
                            })
                            .then(() => {
                                return SavedSearchService.get(this.analysisJob.savedSearchId);
                            })
                            .then((response) => {
                                let savedSearchLookup = modelAssociations.arrayToMap(response.data.data);
                                savedSearchLinker(this.analysisJob, {SavedSearch: savedSearchLookup});
                            })
                            .catch((error) => {
                                console.error("AnalysisJobs::details::error: ", error);
                                growl.warning(
                                    "There was a problem loading this page. Please refresh the page. If you see this message often please let us know.");
                            });


                        this.aceConfig = {
                            useWrapMode: true,
                            showGutter: true,
                            theme: "xcode",
                            mode: "yaml",
                            firstLineNumber: 1,
                            onLoad: function (editor) {
                                controller.aceInstance = editor.getSession();
                                //editor.renderer.$cursorLayer.element.style.display = "none";

                                editor.getSession().setUseSoftTabs(true);
                                // This is to remove following warning message on console:
                                // Automatically scrolling cursor into view after selection change this will be
                                // disabled in the next version set editor.$blockScrolling = Infinity to disable this
                                // message
                                editor.$blockScrolling = Infinity;
                            },
                            onChange: controller.aceChanged
                        };

                        this.chartOptions = {
                            donut: {
                                title: "Analysis Job Progress"
                            },
                            legend: {
                                position: "right"
                            }
                        };

                        this.chartWidth = 400;
                        this.chartHeight = 300;


                        this.chartData = {
                            colors: this.progressKeyColorMap,
                            columns: this.getData(),
                            names: this.progressKeyFriendlyMap,
                            type: "donut",
                            // order is currently broken - see https://github.com/c3js/c3/pull/1814
                            order: null
                        };
                    }

                    getData() {
                        if (!this.analysisJob) {
                            return null;
                        }

                        if (this.analysisJob.isNew || this.analysisJob.isPreparing) {
                            return [[this.analysisJob.overallStatus, 100]];
                        }
                        else {
                            let data = [];
                            Object.keys(this.progressKeyColorMap).forEach((key) => {
                                if (!this.isProgressKeyVisible(key)) {
                                    return;
                                }

                                data.push([
                                    key,
                                    this.analysisJob.overallProgress[key] || 0
                                ]);
                            });

                            return data;
                        }
                    }
                }

                return new JobDetailsController(...dependencies);
            }
        ]);

