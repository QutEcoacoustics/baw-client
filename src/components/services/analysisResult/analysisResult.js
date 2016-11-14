angular
    .module("bawApp.services.analysisResult", [])
    .factory(
        "AnalysisResult",
        [
            "$resource",
            "bawResource",
            "$http",
            "$q",
            "conf.paths",
            "lodash",
            "casingTransformers",
            "QueryBuilder",
            "baw.models.AnalysisResult",
            "$url",
            function ($resource,
                      bawResource,
                      $http,
                      $q,
                      paths,
                      _,
                      casingTransformers,
                      QueryBuilder,
                      AnalysisResultModel,
                      $url) {

                function query(analysisJobId, recordingId) {
                    const url = $url.formatUri(
                        paths.api.routes.analysisResults.jobAbsolute,
                        {analysisJobId, recordingId}
                    );
                    return $http
                        .get(url)
                        .then(x => AnalysisResultModel.makeFromApi(x));
                }

                function get(analysisJobId, path, page = 1) {
                    const url = $url.formatUri(
                        paths.api.routes.analysisResults.jobWithPathAbsolute,
                        {analysisJobId, path}
                    );

                    let pageParams = QueryBuilder.create(function (baseQuery) {
                        let q = baseQuery.page({page: page, items: 100});

                        return q;
                    }).toQueryString();

                    return $http
                        .get(url, {params: pageParams})
                        .then(x => AnalysisResultModel.makeFromApi(x));
                }

                return {
                    query,
                    get
                };
            }
        ]
    );
