angular
    .module("bawApp.jobs.list", [])
    .controller(
        "JobsListController",
        [
            "JobsCommon",
            "$scope",
            "AnalysisJob",
            "conf.paths",
            "baw.models.AnalysisJob.progressKeys",
            "baw.models.AnalysisJob.statusKeys",
            function (JobsCommon, ...dependencies) {
                class JobsListController extends JobsCommon{ // jshint ignore:line
                    constructor($scope, AnalysisJobService, paths, keys, statuses) {
                        super(keys, statuses);
                        let controller = this;


                        this.analysisJobs = [];

                        this.newAnalysisJobRoute = paths.site.ngRoutes.analysisJobs.new;


                        AnalysisJobService
                            .query()
                            .then(function (response) {
                                controller.analysisJobs = response.data.data;

                            });
                    }

                }

                return new JobsListController(...dependencies);

            }
        ]);
