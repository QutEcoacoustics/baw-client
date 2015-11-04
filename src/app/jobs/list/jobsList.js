class JobsListController {
    constructor($scope, AnalysisJobService) {

        $scope.analysisJobs = [];

        AnalysisJobService
            .query()
            .then(function (response) {
                $scope.analysisJobs = response.data.data;
            });
    }
}


angular
    .module("bawApp.jobs.list", [])
    .controller(
        "JobsListController",
        [
            "$scope",
            "AnalysisJob",
            JobsListController
        ]);
