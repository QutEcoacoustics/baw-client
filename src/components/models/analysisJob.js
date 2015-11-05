angular
    .module("bawApp.models.analysisJob", [])
    .factory(
        "baw.models.AnalysisJob",
        [
            "baw.models.associations",
            "baw.models.ApiBase",
            "conf.paths",
            "$url",
            function(associations, ApiBase, paths, $url) {

                class AnalysisJob extends ApiBase {
                    constructor(resource) {
                        super(resource);
                    }

                }

                return AnalysisJob;
            }]);
