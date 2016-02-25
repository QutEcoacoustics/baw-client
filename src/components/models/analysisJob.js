angular
    .module("bawApp.models.analysisJob", [])
    .constant("baw.models.AnalysisJob.progressKeys", {
        "queued": "queued",
        "working": "working",
        "successful": "successful",
        "failed": "failed",
        "total": "total"
    })
    .constant("baw.models.AnalysisJob.statusKeys", {
        "new": "new",
        "preparing": "preparing",
        "processing": "processing",
        "suspended": "suspended",
        "completed": "completed"
    })
    .factory("baw.models.AnalysisJob", [
        "baw.models.associations",
        "baw.models.ApiBase",
        "baw.models.AnalysisJob.progressKeys",
        "baw.models.AnalysisJob.statusKeys",
        "conf.paths",
        "$url",
        "humanize-duration",
        "filesize",
        "moment",
        function (associations, ApiBase, keys, statusKeys, paths, $url, humanizeDuration, filesize, moment) {

            class AnalysisJob extends ApiBase {
                constructor(resource) {
                    super(resource);

                    this.savedSearchId = Number(this.savedSearchId);
                    this.startedAt = new Date(this.startedAt);
                    this.overallStatusModifiedAt = new Date(this.overallStatusModifiedAt);
                    this.overallProgressModifiedAt = new Date(this.overallProgressModifiedAt);
                    this.overallCount = Number(this.overallCount);
                    this.overallDurationSeconds = Number(this.overallDurationSeconds);
                    //this.overallProgress = Object.assign({}, defaultProgress, this.overallProgress);


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
                    return humanizeDuration(this.overallDurationSeconds * 1000, {largest: 2});
                }

                get friendlySize() {
                    if (this.overallSizeBytes) {
                        return filesize(this.overallSizeBytes, {round: 0});
                    }
                    else {
                        return "unknown";
                    }
                }

                get friendlyUpdated() {
                    var lastUpdate = Math.max(this.overallProgressModifiedAt, this.overallStatusModifiedAt);

                    return  moment(lastUpdate).fromNow();
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
