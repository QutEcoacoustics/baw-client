angular
    .module("bawApp.services.analysisJob", [])
    .factory(
        "AnalysisJob",
        [
            "$resource",
            "bawResource",
            "$http",
            "$q",
            "conf.paths",
            "lodash",
            "casingTransformers",
            "QueryBuilder",
            "baw.models.AnalysisJob",
            "SavedSearch",
            "$url",
            function ($resource, bawResource, $http, $q, paths, _, casingTransformers,
                      QueryBuilder, AnalysisJobModel, SavedSearchService, $url) {

                function query() {
                    const url = paths.api.routes.analysisJobs.listAbsolute;
                    return $http
                        .get(url)
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                function get(id) {
                    const url = $url.formatUri(paths.api.routes.analysisJobs.showAbsolute, {analysisJobId: id});
                    return $http
                        .get(url)
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                function getName(id) {
                    const url = paths.api.routes.analysisJobs.filterAbsolute;
                    let query = QueryBuilder.create(function (q) {
                        return q
                            .equal("id", id)
                            .project({include: ["id", "name"]});
                    });
                    return $http
                        .post(url, query.toJSON())
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                function save(model) {
                    const url = paths.api.routes.analysisJobs.listAbsolute;
                    return $http
                        .post(url, model)
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                function saveWithSavedSearch(model) {
                    // save the saved search (if needed)
                    var requestChain = $q.when(model);
                    if (!model.savedSearch.hasId) {
                        requestChain = requestChain
                            .then((model) => SavedSearchService.save(model.savedSearch))
                            .then((result) => {
                                model.savedSearch = result.data.data[0];
                                return model;
                            });
                    }

                    return requestChain.then((model) => save(model));
                }

                return {
                    query,
                    get,
                    getName,
                    save,
                    saveWithSavedSearch
                };
            }]);
