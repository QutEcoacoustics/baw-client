class JobNewController {
    constructor($scope, $routeParams, AnalysisJobService) {



        this.random2 = Math.random() + 2;

        // AnalysisJobService
        //     .get(Number($routeParams.analysisJobId))
        //     .then(function (response) {
        //         $scope.analysisJob = response.data.data[0];
        //
        //     });


        this.aceConfig = {
            useWrapMode : true,
            showGutter: true,
            theme:"xcode",
            mode: "yaml",
            firstLineNumber: 1,
            onLoad: this.aceLoaded,
            onChange: this.aceChanged
        };

        this.aceLoaded = function(editor) {
            editor.getSession().setUseSoftTabs(true);
            // This is to remove following warning message on console:
            // Automatically scrolling cursor into view after selection change this will be disabled in the next
            // version set editor.$blockScrolling = Infinity to disable this message
            editor.$blockScrolling = Infinity;
        };

        this.aceChanged = function() {

        };

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
            JobNewController
        ]);

