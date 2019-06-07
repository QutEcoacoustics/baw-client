angular
    .module("bawApp.models.study", [])
    .constant("baw.models.study.defaultDatasetId", 1)
    .factory("baw.models.study", [
        "baw.models.ApiBase",
        function (ApiBase) {

            class Study extends ApiBase {
                constructor(resource) {
                    super(resource);
                    this.customSettings = this.customSettings || null;
                }

            }

            return Study;
        }]);
