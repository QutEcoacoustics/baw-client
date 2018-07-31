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

                resource.datasetItems = function getDatasetItems(dataset_id) {
                    var url = $url.formatUri(paths.api.routes.datasetItem.listAbsolute, {datasetId: dataset_id});
                    return $http.get(url).then(x => DatasetItemModel.makeFromApi(x));
                };

                return resource;
            }
        ]
    );