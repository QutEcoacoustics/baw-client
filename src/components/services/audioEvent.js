angular
    .module("bawApp.services.audioEvent", [])
    .factory(
        "AudioEvent",
        [
            "$resource", "$http", "bawResource", "$url", "conf.paths", "QueryBuilder", "ResultPager",
            "baw.models.AudioEvent",
            function ($resource, $http, bawResource, $url, paths, QueryBuilder, resultPager, AudioEventModel) {
                var baseCsvUri = paths.api.routes.audioEvent.csvAbsolute;

                var csvOptions = {
                    format: "csv", // "csv", "xml", "json"
                    projectId: null,
                    siteId: null,
                    recordingId: null,
                    startOffset: null,
                    endOffset: null

                };
                // TODO: move this to paths conf object

                function makeCsvLink(options) {
                    var query = angular.extend(csvOptions, options);
                    return $url.formatUri(baseCsvUri, query);
                }

                var resource = bawResource(
                    paths.api.routes.audioEvent.showAbsolute,
                    {recordingId: "@recordingId", audioEventId: "@audioEventId"},
                    {});

                resource.getLibraryItems = function getLibraryItems(query) {
                    var url = paths.api.routes.audioEvent.filterAbsolute;

                    var qb = QueryBuilder.create(function (baseQuery) {
                        let q = baseQuery;
                        if (query.tagsPartial) {
                            q = q.contains("tags.text", query.tagsPartial);
                        }

                        if (query.reference !== undefined && query.reference !== "all") {
                            q = q.eq("isReference", query.reference === "reference");
                        }

                        if (query.userId) {
                            q = q.or(
                                baseQuery.eq("creatorId", query.userId),
                                // hack
                                baseQuery.lt("creatorId", 0)
                                // disabled as updater_id not whitelisted on server :-/
                                /*,
                                 baseQuery.eq("taggings.creatorId", query.userId)

                                 baseQuery.eq("updaterId", query.userId) */
                            );
                        }

                        if (query.audioRecordingId) {
                            q = q.eq("audioRecordingId", query.audioRecordingId);
                        }

                        q = q.range("durationSeconds", {from: query.minDuration, to: query.maxDuration});

                        if (query.lowFrequency) {
                            q = q.gteq("lowFrequencyHertz", query.lowFrequency);
                        }

                        if (query.highFrequency) {
                            q = q.lt("highFrequencyHertz", query.highFrequency);
                        }

                        q = q.page(query);
                        if (query.sortBy && query.sortByType) {
                            q = q.sort({orderBy: query.sortBy, direction: query.sortByType});
                        }

                        return q;
                    });

                    return $http.post(url, qb.toJSONString());
                };

                const filterUrl = paths.api.routes.audioEvent.filterAbsolute;
                resource.getAudioEventsByIds = function (audioEventIds) {
                    var query = QueryBuilder.create(function (q) {
                        return q.in("id", audioEventIds);
                    });

                    return $http
                        .post(filterUrl, query.toJSONString())
                        .then(x => AudioEventModel.makeFromApi(x));
                };

                resource.getAudioEventsWithinRange = function (audioRecordingId, offsets) {
                    var query = QueryBuilder.create(function (q) {
                        return q.and(
                            q.eq("audioRecordingId", audioRecordingId),
                            q.gteq("startTimeSeconds", offsets[0]),
                            q.lt("endTimeSeconds", offsets[1])
                        );
                    });

                    return $http.post(filterUrl, query.toJSONString())
                        .then(resultPager.loadAll)
                        .then(x => AudioEventModel.makeFromApi(x));
                };

                resource.csvLink = makeCsvLink;

                return resource;
            }
        ]
    );