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
                        "id": 261,
                        "name": "job name 261",
                        "script_id": 261,
                        "creator_id": 144,
                        "updater_id": 9,
                        "created_at": "2015-11-06T00:37:52.201+07:00",
                        "updated_at": "2015-11-06T00:37:52.201+07:00",
                        "description": null,
                        "saved_search_id": 261,
                        "saved_search": {
                            "id": 261,
                            "name": "saved search name 261",
                            "description": "saved search description 261",
                            "stored_query": {
                                "uuid": {
                                    "eq": "blah blah"
                                }
                            },
                            "creator_id": 1410,
                            "created_at": "2015-11-06T00:37:52.183+07:00"
                        },
                        "script": {
                            "id": 261,
                            "name": "script name 261",
                            "description": "script description 261",
                            "analysis_identifier": "script machine identifier 261",
                            "version": 2.61,
                            "creator_id": 1410,
                            "created_at": "2015-11-06T00:37:52.192+07:00"
                        }
                    },
                    {
                        "id": 26,
                        "name": "job name 26",
                        "script_id": 26,
                        "creator_id": 144,
                        "updater_id": 9,
                        "created_at": "2015-11-06T00:37:52.201+07:00",
                        "updated_at": "2015-11-06T00:37:52.201+07:00",
                        "description": null,
                        "saved_search_id": 26,
                        "saved_search": {
                            "id": 26,
                            "name": "saved search name 26",
                            "description": "saved search description 26",
                            "stored_query": {
                                "uuid": {
                                    "eq": "blah blah"
                                }
                            },
                            "creator_id": 1410,
                            "created_at": "2015-11-06T00:37:52.183+07:00"
                        },
                        "script": {
                            "id": 26,
                            "name": "script name 26",
                            "description": "script description 26",
                            "analysis_identifier": "script machine identifier 26",
                            "version": 2.61,
                            "creator_id": 1410,
                            "created_at": "2015-11-06T00:37:52.192+07:00"
                        }
                    },
                    {
                        "id": 61,
                        "name": "job name 61",
                        "script_id": 61,
                        "creator_id": 9,
                        "updater_id": 144,
                        "created_at": "2015-11-06T00:37:52.201+07:00",
                        "updated_at": "2015-11-06T00:37:52.201+07:00",
                        "description": null,
                        "saved_search_id": 61,
                        "saved_search": {
                            "id": 61,
                            "name": "saved search name 61",
                            "description": "saved search description 61",
                            "stored_query": {
                                "uuid": {
                                    "eq": "blah blah"
                                }
                            },
                            "creator_id": 1410,
                            "created_at": "2015-11-06T00:37:52.183+07:00"
                        },
                        "script": {
                            "id": 61,
                            "name": "script name 61",
                            "description": "script description 61",
                            "analysis_identifier": "script machine identifier 61",
                            "version": 2.61,
                            "creator_id": 1410,
                            "created_at": "2015-11-06T00:37:52.192+07:00"
                        }
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
                        "overall_status": "new",
                        "overall_status_modified_at": "2016-02-18 06:03:10.028276",
                        "overall_progress": {"queued":0,"working":0,"successful":0,"failed":0,"total":0},
                        "overall_progress_modified_at": "2016-02-18 06:03:10.028776",
                        "overall_count": 1,
                        "overall_duration_seconds": 1.0000
                    }

                ];
                fakedData = casingTransformers.transformObject(fakedData, casingTransformers.camelize);

                function query() {
                    //const path = paths.api.routes.analysisResults;
                    return $q.when({data: {data: fakedData}})
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                function get(id) {
                    return $q.when({data: {data: fakedData.find(x => x.id = id)}})
                        .then(x => AnalysisJobModel.makeFromApi(x));
                }

                return {
                    query,
                    get
                };
            }]);
