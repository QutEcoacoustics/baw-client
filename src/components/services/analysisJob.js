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

                /*// FAKED!
                 let fakedData = [
                 {
                 "id": 11111,
                 "name": "fake 11111 new fake",
                 "annotation_name": null,
                 "custom_settings": "#custom settings 267",
                 "script_id": 1,
                 "creator_id": 144,
                 "updater_id": 144,
                 "deleter_id": null,
                 "deleted_at": null,
                 "created_at": "2016-01-18 06:03:10.047508",
                 "updated_at": "2016-02-01 06:03:10.093619",
                 "description": null,
                 "saved_search_id": 1,
                 "started_at": "2016-02-18 06:03:10.028024",
                 "overall_status": "new",
                 "overall_status_modified_at": "2016-02-18 06:03:10.028276",
                 "overall_progress": {},
                 "overall_progress_modified_at": "2016-02-18 06:03:10.028776",
                 "overall_count": 66,
                 "overall_duration_seconds": 6600

                 },
                 {
                 "id": 22222,
                 "name": "fake 22222 fake fake 22222 fake fake 22222 fake ",
                 "annotation_name": null,
                 "custom_settings": "#custom settings 267",
                 "script_id": 1,
                 "creator_id": 9,
                 "updater_id": 144,
                 "deleter_id": null,
                 "deleted_at": null,
                 "created_at": "2016-01-18 06:03:10.047508",
                 "updated_at": "2016-02-01 06:03:10.093619",
                 "description": null,
                 "saved_search_id": 1,
                 "started_at": "2016-02-18 06:03:10.028024",
                 "overall_status": "preparing",
                 "overall_status_modified_at": "2016-02-18 06:03:10.028276",
                 "overall_progress": {},
                 "overall_progress_modified_at": "2016-02-18 06:03:10.028776",
                 "overall_count": 77,
                 "overall_duration_seconds": 77700

                 },
                 {
                 "id": 1,
                 "name": "\"simulate work analysis\" run on the \"All sites in SERF Acoustic Study\" data",
                 "annotation_name": null,
                 "custom_settings": "#custom settings 267",
                 "script_id": 1,
                 "creator_id": 9,
                 "updater_id": 9,
                 "deleter_id": null,
                 "deleted_at": null,
                 "created_at": "2016-02-18 06:03:10.047508",
                 "updated_at": "2016-02-18 06:03:10.093619",
                 "description": null,
                 "saved_search_id": 1,
                 "started_at": "2016-02-18 06:03:10.028024",
                 "overall_status": "processing",
                 "overall_status_modified_at": "2016-02-18 06:03:10.028276",
                 "overall_progress": {"queued": 10, "working": 1, "successful": 35, "failed": 4, "total": 0},
                 "overall_progress_modified_at": (new Date()).setMinutes(0, 0, 0),
                 "overall_count": 50,
                 "overall_duration_seconds": 88888,
                 "overall_size_bytes": 123456789
                 },
                 {
                 "id": 3600,
                 "name": "fake 3600 completed fake",
                 "annotation_name": null,
                 "custom_settings": "#custom settings 267",
                 "script_id": 1,
                 "creator_id": 9,
                 "updater_id": 144,
                 "deleter_id": null,
                 "deleted_at": null,
                 "created_at": "2016-01-18 06:03:10.047508",
                 "updated_at": "2016-02-01 06:03:10.093619",
                 "description": null,
                 "saved_search_id": 1,
                 "started_at": "2016-02-18 06:03:10.028024",
                 "overall_status": "completed",
                 "overall_status_modified_at": "2016-02-18 06:03:10.028276",
                 "overall_progress": {"queued": 0, "working": 0, "successful": 90, "failed": 10, "total": 100},
                 "overall_progress_modified_at": "2016-02-18 06:03:10.028776",
                 "overall_count": 100,
                 "overall_duration_seconds": 100 * 3600 * 2,
                 "overall_size_bytes": 123456789

                 },

                 {
                 "id": 99999,
                 "name": "fake 99999 suspended fake",
                 "annotation_name": null,
                 "custom_settings": "#custom settings 267",
                 "script_id": 1,
                 "creator_id": 9,
                 "updater_id": 144,
                 "deleter_id": null,
                 "deleted_at": null,
                 "created_at": "2016-01-18 06:03:10.047508",
                 "updated_at": "2016-02-01 06:03:10.093619",
                 "description": null,
                 "saved_search_id": 1,
                 "started_at": "2016-02-18 06:03:10.028024",
                 "overall_status": "suspended",
                 "overall_status_modified_at": "2016-02-18 06:03:10.028276",
                 "overall_progress": {"queued": 10, "working": 0, "successful": 80, "failed": 10, "total": 100},
                 "overall_progress_modified_at": "2016-02-18 06:03:10.028776",
                 "overall_count": 99,
                 "overall_duration_seconds": 99999

                 }

                 ];
                 fakedData = casingTransformers.transformObject(fakedData, casingTransformers.camelize);
                 */

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
