angular
    .module("bawApp.models.analysisJob", [])
    .factory(
        "baw.models.AnalysisJob",
        [
            "baw.models.associations",
            "baw.models.ApiBase",
            "conf.paths",
            "$url",
            "humanize-duration",
            function (associations, ApiBase, paths, $url, humanizeDuration) {
                const statusKeys = {
                    "new": "new",
                    "preparing": "preparing",
                    "processing": "processing",
                    "suspended": "suspended",
                    "completed": "completed"
                };

                const progressKeys = { // jshint ignore:line
                    "queued": 0,
                    "working": 0,
                    "successful": 0,
                    "failed": 0,
                    "total": 0
                };

                class AnalysisJob extends ApiBase {
                    constructor(resource) {
                        super(resource);

                        this.savedSearchId = Number(this.savedSearchId);
                        this.startedAt = new Date(this.startedAt);
                        this.overallStatusModifiedAt = new Date(this.overallStatusModifiedAt);
                        this.overallProgressModifiedAt = new Date(this.overallProgressModifiedAt);
                        this.overallCount = Number(this.overallCount);
                        this.overallDurationSeconds = Number(this.overallDurationSeconds);
                        
                    }


                    get isNew() {
                        return this.overallStatus === statusKeys.new;
                    }

                    get isPreparing() {
                        return this.overallStatus === statusKeys.preparing;
                    }

                    get isProcessing() {
                        return this.overallStatus === statusKeys.processing;
                    }

                    get isSuspended() {
                        return this.overallStatus === statusKeys.suspended;
                    }

                    get isCompleted() {
                        return this.overallStatus === statusKeys.completed;
                    }
                    
                    get isActive() {
                        return this.isNew || this.isPreparing || this.isProcessing;
                    }

                    get friendlyDuration() {
                        return humanizeDuration(this.overallDurationSeconds * 1000);
                    }

                    get viewUrl() {
                        return $url.formatUri(
                            paths.site.ngRoutes.analysisJobs.details,
                            {analysisJobId: this.id}
                        );
                    }

                    static get viewListUrl() {
                        return $url.formatUri(paths.site.ngRoutes.analysisJobs.list);
                    }

                }

                return AnalysisJob;
            }]);
