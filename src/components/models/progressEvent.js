angular
    .module("bawApp.models.progressEvent", [])
    .factory("baw.models.progressEvent", [
        "baw.models.ApiBase",
        function (ApiBase) {

            class ProgressEvent extends ApiBase {
                constructor(resource) {
                    super(resource);
                    this.customSettings = this.customSettings || null;
                }

            }

            return ProgressEvent;
        }]);
