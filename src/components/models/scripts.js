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
                    this.executableSettingsMediaType = this.executableSettingsMediaType || null; 


                }


                get friendlyUpdated() {
                    var lastUpdate = this.createdAt;

                    return  moment(lastUpdate).fromNow();
                }



            }

            return Script;
        }]);
