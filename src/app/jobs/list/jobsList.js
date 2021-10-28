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
            "baw.models.AnalysisJob.progressKeysFriendly",
            "baw.models.AnalysisJob.statusKeys",
            function (JobsCommon, ...dependencies) {
                class JobsListController extends JobsCommon{ // jshint ignore:line
                    constructor($scope, AnalysisJobService, paths, keys, friendlyKeys, statuses) {
                        super(keys, friendlyKeys, statuses);
                        let controller = this;


                        this.analysisJobs = null;

                        this.newAnalysisJobRoute = paths.site.ngRoutes.analysisJobs.newAbsolute;


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
