class JobsCommon { // jshint ignore:line
    constructor(keys, friendlyKeys, statuses) {
        this.skipProgressKeys = ["total"];

        this.progressKeyClassMap = {
            [keys.queued]: "warning",
            [keys.working]: "info",
            [keys.successful]: "success",
            [keys.failed]: "danger"
        };

        this.progressKeyFriendlyMap = friendlyKeys;

        // .../baw-client/vendor/bootstrap-sass/assets/stylesheets/bootstrap/_variables.scss#18
        this.progressKeyColorMap = {
            [keys.new]: "#337ab7",
            [keys.queued]: "#f0ad4e",
            [keys.working]: "#5bc0de",
            [keys.cancelling]: "#e67b48",
            [keys.cancelled]: "#e67b48",
            //https://color.adobe.com/create/color-wheel/?base=2&rule=Shades&selected=4&name=My%20Color%20Theme&mode=rgb&rgbvalues=0.6009803921568627,0.22986807626280595,0.2187900966838348,0.3509803921568627,0.13424595644711995,0.1277762717990422,0.8509803921568627,0.3254901960784314,0.30980392156862746,0.9009803921568628,0.3446146200416291,0.32800668654558596,0.7509803921568627,0.2872413481522175,0.27339839161471036&swatchOrder=0,1,2,3,4
            [keys.failed]: "#d9534f",
            [keys.timedOut]: "#BF4946",
            [keys.successful]: "#5cb85c",
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

    getColor(key) {
        return this.progressKeyColorMap[key];
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
            "baw.models.AnalysisJob.progressKeysFriendly",
            "baw.models.AnalysisJob.statusKeys",
            function (...dependencies) {
                return JobsCommon;
            }
        ]);
