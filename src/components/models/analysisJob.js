angular
    .module("bawApp.models.analysisJob", [])
    .constant("baw.models.AnalysisJob.progressKeys", {
        "new":"new",
        "queued": "queued",
        "working": "working",
        "successful": "successful",
        "failed": "failed",
        "timedOut": "timedOut",
        "cancelling": "cancelling",
        "cancelled": "cancelled",
        "total": "total"
    })
    .constant("baw.models.AnalysisJob.progressKeysFriendly", {
        "new":"new",
        "queued": "queued",
        "working": "working",
        "successful": "successful",
        "failed": "failed",
        "timedOut": "timed out",
        "cancelling": "cancelling",
        "cancelled": "cancelled",
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
        "baw.models.AnalysisJob.progressKeysFriendly",
        "baw.models.AnalysisJob.statusKeys",
        "baw.models.Capabilities",
        "UserProfile",
        "conf.paths",
        "$url",
        "humanize-duration",
        "filesize",
        "moment",
        function (associations, ApiBase, progressKeys, friendlyKeys, statusKeys, Capabilities, UserProfile, paths, $url,
                  humanizeDuration, filesize, moment) {

            class AnalysisJob extends ApiBase {
                constructor(resource) {
                    super(resource);

                    this.customSettings = this.customSettings || null;
                    this.overallStatusModifiedAt = new Date(this.overallStatusModifiedAt);
                    this.overallProgressModifiedAt = new Date(this.overallProgressModifiedAt);
                    this.overallCount = Number(this.overallCount);
                    this.overallDurationSeconds = Number(this.overallDurationSeconds);
                    this.overallDataLengthBytes = this.overallDataLengthBytes || null;
                    this.overallStatus = this.overallStatus || null;
                    this.overallProgress = this.overallProgress || null;
                    this.savedSearchId = Number(this.savedSearchId);
                    this.scriptId = this.scriptId || null;
                    this.startedAt = new Date(this.startedAt);
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



                get completedRatio() {
                    return (
                            (this.overallProgress[progressKeys.successful] || 0) +
                            (this.overallProgress[progressKeys.failed] || 0) +
                            (this.overallProgress[progressKeys.timedOut] || 0) +
                            (this.overallProgress[progressKeys.cancelled] || 0)
                        ) / this.overallCount;
                }

                get successfulRatio() {
                    return (this.overallProgress[progressKeys.successful] || 0) / this.overallCount;
                }


                get friendlyDuration() {
                    return humanizeDuration(this.overallDurationSeconds * 1000, {largest: 2});
                }

                get friendlyRunningTime() {
                    let lastUpdate = Math.max(+this.overallProgressModifiedAt, +this.overallStatusModifiedAt),
                        delta = +lastUpdate - +this.createdAt;

                    return  moment.duration(delta).humanize();
                }


                get friendlySize() {
                    if (this.overallDataLengthBytes !== undefined ) {
                        return filesize(this.overallDataLengthBytes, {round: 0});
                    }
                    else {
                        return "unknown";
                    }
                }

                get friendlyUpdated() {
                    var lastUpdate = Math.max(this.overallProgressModifiedAt, this.overallStatusModifiedAt);

                    return  moment(lastUpdate).fromNow();
                }

                /*
                 * used when creating model for server side validation error
                 */
                get validations() {
                    if (!this._validations) {
                        this._validations = {
                            name: {
                                taken: []
                            }
                        };
                    }
                    return this._validations;
                }
                
                get resultsUrl() {
                    return $url.formatUri(
                        paths.site.links.analysisJobs.analysisResults,
                        {analysisJobId: this.id}
                    );
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

                friendlyProgressString(key) {
                    return friendlyKeys[key];
                }

                generateSuggestedName() {
                    //let currentUserName =  !!UserProfile.profile ? UserProfile.profile.userName : "(unknown user)";
                    let scriptName = !!this.script ? this.script.name : "(not chosen)";
                    let savedSearchName = !!this.savedSearch && !!this.savedSearch.name ? this.savedSearch.name : "(not chosen)";
                    return `"${scriptName}" analysis run on the "${savedSearchName}" data`;
                }


                get savedSearch() {
                    return this._savedSearch || null;
                }

                set savedSearch(value) {
                    this._savedSearch = value;
                    this.savedSearchId = value && value.id || null;
                }

                get script() {
                    return this._script || null;
                }

                set script(value) {
                    this._script = value;
                    this.scriptId = value && value.id || null;
                }

                // capabilities (mocked here until API capabilities are real
                static get capabilities() {
                    return {
                        "update": {
                            can: (action, source) => source.isOwnedBy(UserProfile.profile)
                        },
                        "destroy": {
                            _hasPermission(source) {
                                return source.isOwnedBy(UserProfile.profile);
                            },
                            _validWorkflowState(source) {
                                return source.isSuspended || source.isCompleted || source.isProcessing;
                            },
                            can(action, source) {
                                return action._hasPermission(source) && action._validWorkflowState(source);
                            },
                            details: "",
                            message(action, source) {
                                if (!action._hasPermission(source)) {
                                    return Capabilities.reasons.unauthorized;
                                }
                                else {
                                    if (!action._validWorkflowState(source)) {
                                        return Capabilities.reasons.conflict;
                                    }
                                }

                                return null;
                            }
                        },
                        "create": {
                            can: true
                        },
                        "pause": {
                            can: (action, source) => source.isOwnedBy(UserProfile.profile) && source.isProcessing
                        },
                        "resume": {
                            can: (action, source) => source.isOwnedBy(UserProfile.profile) && source.isSuspended
                        },
                        "retry": {
                            can(action, source) {
                                return source.isOwnedBy(UserProfile.profile) && source.isCompleted && source.successfulRatio < 1.0;
                            }
                        }
                    };
                }

                toJSON() {
                    return {
                        name: this.name,
                        description: this.description,
                        customSettings: this.customSettings,
                        scriptId: this.scriptId,
                        savedSearchId: this.savedSearchId
                    };
                }

            }

            return AnalysisJob;
        }]);
