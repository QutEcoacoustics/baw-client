angular
    .module("bawApp.models.script", [])
    .factory("baw.models.Script", [
        "baw.models.associations",
        "baw.models.ApiBase",
        "conf.paths",
        "$url",
        "humanize-duration",
        "moment",
        function (associations, ApiBase, paths, $url, humanizeDuration, moment) {

            class Script extends ApiBase {
                constructor(resource) {
                    super(resource);


                    this.version = Number(this.version);

                    this.executableSettings = this.executableSettings || null;


                }


                get friendlyUpdated() {
                    var lastUpdate = Math.max(this.overallProgressModifiedAt, this.overallStatusModifiedAt);

                    return  moment(lastUpdate).fromNow();
                }



            }

            return Script;
        }]);
