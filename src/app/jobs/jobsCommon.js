class JobsCommon { // jshint ignore:line
    constructor(keys, statuses) {
        this.skipProgressKeys = ["total", "preparing"];
        this.progressKeyClassMap = {
            [keys.queued]: "warning",
            [keys.working]: "info",
            [keys.successful]: "success",
            [keys.failed]: "danger"
        };

        // .../baw-client/vendor/bootstrap-sass/assets/stylesheets/bootstrap/_variables.scss#18
        this.progressKeyColorMap = {
            [keys.queued]: "#f0ad4e",
            [keys.working]: "#5bc0de",
            [keys.successful]: "#5cb85c",
            [keys.failed]: "#d9534f",
            ["preparing"]: "#337ab7"
        };

        this.statusKeyClassMap = {
            [statuses.new]: "primary",
            [statuses.preparing]: "primary",
            [statuses.processing]: "info",
            [statuses.suspended]: "warning",
            [statuses.completed]: "success"
        };

    }

    getType(key) {
        return this.progressKeyClassMap[key];
    }

    isProgressKeyVisible(key) {
        // if key isn't found in list of keys to skip
        // it should be visible
        return this.skipProgressKeys.indexOf(key) < 0;
    }

    getOverallStatusType(status) {
        return this.statusKeyClassMap[status];
    }
}

angular
    .module("bawApp.jobs.common", [])
    .factory(
        "JobsCommon",
        [
            "baw.models.AnalysisJob.progressKeys",
            "baw.models.AnalysisJob.statusKeys",
            function (...dependencies) {
                return JobsCommon;
            }
        ]);
