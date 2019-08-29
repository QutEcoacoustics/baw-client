angular
    .module("bawApp.models.datasetItem", [])
    .constant("baw.models.datasetItem.defaultDatasetId", 1)
    .factory("baw.models.datasetItem", [
        "baw.models.ApiBase",
        function (ApiBase) {

            class DatasetItem extends ApiBase {
                constructor(resource) {
                    super(resource);
                    this.customSettings = this.customSettings || null;
                }

            }

            return DatasetItem;
        }]);
