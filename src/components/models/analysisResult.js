angular
    .module("bawApp.models.analysisResult", [])
    .factory("baw.models.AnalysisResult", [
        "baw.models.associations",
        "baw.models.ApiBase",

        "conf.paths",
        "$url",
        "humanize-duration",
        "filesize",
        "moment",
        "MimeType",
        function (associations, ApiBase, paths, $url, humanizeDuration, filesize, moment, MimeType) {

            class AnalysisResult extends ApiBase {
                constructor(resource, parent) {
                    super(resource);

                    this._parent = parent;
                    this.path = this.path || "/";
                    this.name = this.name || "/";
                    this.type = this.type || "directory";
                    this.mime = this.mime || null;
                    this.sizeBytes = Number.isFinite(this.sizeBytes) ? this.sizeBytes : null;
                    this.hasChildren = this.hasChildren === true || false;
                    this.hasZip = this.hasZip === true || false;

                    let children = [];
                    if (this.children) {
                        // recursive!
                        children = this
                            .children
                            .map(x => new AnalysisResult(x, this))
                            .sort(AnalysisResult.sort);
                    }
                    this.children = children;
                }

                get analysisJob() {
                    // allow linking back to results's parent directory to get analysisJob
                    // that generated these results
                    return this._analysisJob || (this._parent && this._parent.analysisJob);
                }

                set analysisJob(value) {
                    this._analysisJob = value;
                }

                get analysisJobId() {
                    // allow linking back to results's parent directory to get analysisJob
                    // that generated these results
                    return this._analysisJobId || (this._parent && this._parent.analysisJobId);
                }

                set analysisJobId(value) {
                    this._analysisJobId = value;
                }

                get audioRecordingId() {
                    // allow linking back to results's parent directory to get audioRecordingId
                    // that generated these results
                    return this._audioRecordingId || (this._parent && this._parent.audioRecordingId);
                }

                set audioRecordingId(value) {
                    this._audioRecordingId = value;
                }


                get isDirectory() {
                    return this.type === "directory";
                }

                get isFile() {
                    return this.type === "file";
                }

                get friendlySize() {
                    if (Number.isFinite(this.sizeBytes)) {
                        return filesize(this.sizeBytes, {round: 0});
                    }
                    else {
                        return "";
                    }
                }

                get icon() {
                    if (this.isDirectory) {
                        return "fa fa-folder-o";
                    }

                    return MimeType.mimeToFaIcon(this.mime);
                }

                get path() {
                    // allow linking back to results's parent directory to get path
                    // that generated these results

                    if (this._path) {
                        return this._path;
                    }

                    if (!this._parent) {
                        return undefined;
                    }

                    let path = this._parent.path;

                    if (!path) {
                        return undefined;
                    }

                    if (!path.endsWith("/")) {
                        path = path + "/";
                    }

                    return path + this.name;
                }

                set path(value) {
                    this._path = value;
                }


                // url to the resource
                // also used to download the resource
                get url() {
                    var root = paths.api.root;

                    return root + this.path;
                }
                
                get zipUrl() {
                    if (this.isDirectory) {
                        return this.url + ".zip";
                    }
                }

                get viewUrl() {
                    let analysisJobId = this.analysisJobId;

                    // modify the path to strip the first few segments
                    var pathFragment = this.viewPath;

                    let url = paths.site.links.analysisJobs.analysisResultsWithPath;
                    let result = $url.formatUri(
                        url,
                        {analysisJobId, path:  pathFragment}
                    );

                    return result;
                }

                get viewPath() {
                    let analysisJobId = this.analysisJobId;

                    // modify the path to strip the first few segments
                    var baseUrl = $url.formatUri(paths.api.routes.analysisResults.jobPrefix, {analysisJobId});
                    var pathFragment = this.path.replace(baseUrl, "");

                    return "/" + pathFragment;
                }

                static sort(a, b) {
                    if (!a) {
                        return -1;
                    }

                    if (!b) {
                        return 1;
                    }

                    let aDir = a.isDirectory,
                        bDir = b.isDirectory;

                    if (aDir && !bDir) {
                        return -1;
                    }

                    if (!aDir && bDir) {
                        return 1;
                    }

                    // if both not dirs, or if both dirs, sort on name
                    return a.name.localeCompare(b.name);
                }


            }

            return AnalysisResult;
        }]);
