class JobDetailsController {
    constructor($scope, $routeParams, $http, AnalysisJobService) {

        $scope.analysisJob = null;

        AnalysisJobService
            .get($routeParams.analysisJobId)
            .then(function (response) {
                $scope.analysisJob = response.data.data[0];
            });

        $scope.pieChart = {};

        $http.get("https://api.imgur.com/3/album/d6tSP", {
            headers: {
                "Authorization": "Client-ID 43d0684d25f69f1"
            },
            withCredentials: false
        }).then(
            function success(response) {
                let random = Math.randomInt(0, response.data.data.images.length);
                $scope.pieChart = response.data.data.images[random];
            },
            function failure() {
                console.error("API fail");
            }
        );
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
            "AnalysisJob",
            JobDetailsController
        ]);

