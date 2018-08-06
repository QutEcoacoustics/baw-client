angular
    .module("bawApp.services.datasetItem", [])
    .factory(
        "DatasetItem",
        [
            "$resource",
            "$http",
            "bawResource",
            "$url",
            "conf.paths",
            "baw.models.datasetItem",
            function ($resource, $http, bawResource, $url, paths, DatasetItemModel) {

                var resource = bawResource(
                    paths.api.routes.datasetItem.showAbsolute,
                    {datasetId: "@datasetId", datasetItemId: "@datasetItemId"},
                    {});

                resource.datasetItems = function getDatasetItems(datasetId, pageNum) {
                    var url = $url.formatUri(paths.api.routes.datasetItem.listAbsolute, {datasetId: datasetId, page: pageNum});
                    return $http.get(url).then(x => {
                        return DatasetItemModel.makeFromApi(x);
                    });
                };

                resource.datasetItem = function getDatasetItem(datasetId, datasetItemId) {
                    var url = $url.formatUri(paths.api.routes.datasetItem.showAbsolute, {datasetId: datasetId, datasetItemId: datasetItemId});
                    return $http.get(url).then(x => DatasetItemModel.makeFromApi(x));
                };

                return resource;
            }
        ]
    );