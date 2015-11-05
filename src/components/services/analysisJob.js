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
            "QueryBuilder",
            "baw.models.AnalysisJob",
            function ($resource, bawResource, $http, $q, paths, _, QueryBuilder, AnalysisJobModel) {

                function query() {
                    //const path = paths.api.routes.analysisResults;

                    // FAKED!
                    let fakedData = [
                        {
                            "id": 261,
                            "name": "job name 261",
                            "script_id": 261,
                            "creator_id": 1410,
                            "updater_id": null,
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
                            "creator_id": 1410,
                            "updater_id": null,
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
                            "creator_id": 1410,
                            "updater_id": null,
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
                        }
                    ];

                    return $q.when({data: { data: fakedData}})
                        .then( x => AnalysisJobModel.makeFromApi(x) );
                }

                return {
                    query
                };
            }]);
