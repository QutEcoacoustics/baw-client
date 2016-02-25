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
            function ($resource, bawResource, $http, $q, paths, _, casingTransformers, QueryBuilder, AnalysisJobModel) {

                // FAKED!
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
                        "name": "fake 22222 fake",
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
                        "name": "job test creation",
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
                        "overall_progress": {"queued":10,"working":1,"successful":35,"failed":4,"total":0},
                        "overall_progress_modified_at": "2016-02-18 06:03:10.028776",
                        "overall_count": 50,
                        "overall_duration_seconds": 88888
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
                        "overall_progress": {"queued":0,"working":0,"successful":90,"failed":10,"total":100},
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
                        "overall_progress": {"queued":10,"working":0,"successful":80,"failed":10,"total":100},
                        "overall_progress_modified_at": "2016-02-18 06:03:10.028776",
                        "overall_count": 99,
                        "overall_duration_seconds": 99999

                    }

                ];
                fakedData = casingTransformers.transformObject(fakedData, casingTransformers.camelize);

                function query() {
                    //const path = paths.api.routes.analysisResults;
                    return $q.when({data: {data: fakedData}})
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                function get(id) {
                    return $q.when({data: {data: fakedData.find(x => x.id === id)}})
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                return {
                    query,
                    get
                };
            }]);
