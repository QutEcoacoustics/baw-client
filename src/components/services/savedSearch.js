angular
    .module("bawApp.services.savedSearch", [])
    .factory(
        "SavedSearch",
        [
            "$resource",
            "bawResource",
            "$http",
            "$q",
            "conf.paths",
            "lodash",
            "casingTransformers",
            "QueryBuilder",
            "baw.models.SavedSearch",
            "$url",
            function ($resource, bawResource, $http, $q, paths, _, casingTransformers, QueryBuilder, SavedSearchModel, $url) {
                /*
                // FAKED!
                let fakedData = [

                    {
                        "id": 1,
                        "name": "test saved search - SERF",
                        "description": "I'm a description and that's ok",
                        "stored_query":{"siteId":{"in":[398, 401, 399, 402, 400, 508 ] }},
                        "creator_id": 9,
                        "created_at": "2016-02-18T15:21:45.862+10:00",
                        "project_ids":[397, 469],
                        "analysis_job_ids":[1]
                    },
                    {
                        "id": 2,
                        "name": "FAKE DATA test saved search - SERFishg",
                        "description": "I'm a description and that's ok ALA LA la La al LAA",
                        "stored_query":{"siteId":{"in":[398, 754 ] }},
                        "creator_id": 144,
                        "created_at": "2016-03-01T15:21:45.862+10:00",
                        "project_ids":[397, 645],
                        "analysis_job_ids":[]
                    }
                ];
                fakedData = casingTransformers.transformObject(fakedData, casingTransformers.camelize);
                */

                function query() {
                    const url = paths.api.routes.savedSearches.listAbsolute;
                    return $http
                        .get(url)
                        .then(x => SavedSearchModel.makeFromApi(x));
                }

                function get(id) {
                    const url = $url.formatUri(paths.api.routes.savedSearches.showAbsolute, {savedSearchId: id});
                    return $http
                        .get(url)
                        .then(x => SavedSearchModel.makeFromApi(x));
                }

                function save(model) {
                    const url = paths.api.routes.savedSearches.listAbsolute;
                    return $http
                        .post(url, {savedSearch: model })
                        .then(x => SavedSearchModel.makeFromApi(x));
                }

                return {
                    query,
                    get,
                    save
                };
            }]);
