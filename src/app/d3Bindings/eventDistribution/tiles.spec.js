//noinspection JSUnresolvedFunction
describe("The TilingFunctions class", function () {

    beforeEach(module("rails", "bawApp.vendorServices", "bawApp.models", "bawApp.d3.eventDistribution"));


    var examples = {
        belowDuration: {
            data: {
                "id": 123456,
                "uuid": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "recorded_date": "2012-10-12T14:00:00.000+10:00",
                "site_id": 399,
                "duration_seconds": 7199.004,
                "sample_rate_hertz": 22050,
                "channels": 2,
                "bit_rate_bps": 706000,
                "media_type": "audio/x-wav",
                "data_length_bytes": 634952704,
                "status": "ready",
                "created_at": "2013-04-22T09:16:35.000+10:00",
                "updated_at": "2016-02-08T12:28:44.340+10:00"
            }
        },
        slightlyAboveDuration: {
            "data": {
                "id": 123123,
                "uuid": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "recorded_date": "2012-10-19T04:00:00.000+10:00",
                "site_id": 399,
                "duration_seconds": 7200.003,
                "sample_rate_hertz": 22050,
                "channels": 2,
                "bit_rate_bps": 706000,
                "media_type": "audio/x-wav",
                "data_length_bytes": 635040768,
                "status": "ready",
                "created_at": "2013-04-22T07:40:35.000+10:00",
                "updated_at": "2016-02-08T12:28:43.629+10:00"
            }
        },
        perfectDuration: {
            "data": {
                "id": 654321,
                "uuid": "cccccccc-cccc-cccc-cccc-cccccccccccc",
                "recorded_date": "2015-12-17T19:00:00.000+10:00",
                "site_id": 1332,
                "duration_seconds": 7200,
                "sample_rate_hertz": 22050,
                "channels": 1,
                "bit_rate_bps": 352800,
                "media_type": "audio/wav",
                "data_length_bytes": 317553152,
                "status": "ready",
                "created_at": "2016-01-26T10:17:24.408+10:00",
                "updated_at": "2016-02-08T12:31:55.640+10:00"
            }
        },
        notOnHourBelowDuration: {
            data: {
                "id": 123457,
                "uuid": "abaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "recorded_date": "2012-10-12T14:13:00.000+10:00",
                "site_id": 399,
                "duration_seconds": 7199.004,
                "sample_rate_hertz": 22050,
                "channels": 2,
                "bit_rate_bps": 706000,
                "media_type": "audio/x-wav",
                "data_length_bytes": 634952704,
                "status": "ready",
                "created_at": "2013-04-22T09:16:35.000+10:00",
                "updated_at": "2016-02-08T12:28:44.340+10:00"
            }
        },
        notOnHourSlightlyAboveDuration: {
            "data": {
                "id": 123124,
                "uuid": "bcbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "recorded_date": "2012-10-19T04:45:00.000+10:00",
                "site_id": 399,
                "duration_seconds": 7200.003,
                "sample_rate_hertz": 22050,
                "channels": 2,
                "bit_rate_bps": 706000,
                "media_type": "audio/x-wav",
                "data_length_bytes": 635040768,
                "status": "ready",
                "created_at": "2013-04-22T07:40:35.000+10:00",
                "updated_at": "2016-02-08T12:28:43.629+10:00"
            }
        },
        notOnHourPerfectDuration: {
            "data": {
                "id": 654322,
                "uuid": "cdcccccc-cccc-cccc-cccc-cccccccccccc",
                "recorded_date": "2015-12-17T19:30:35.000+10:00",
                "site_id": 1332,
                "duration_seconds": 7200,
                "sample_rate_hertz": 22050,
                "channels": 1,
                "bit_rate_bps": 352800,
                "media_type": "audio/wav",
                "data_length_bytes": 317553152,
                "status": "ready",
                "created_at": "2016-01-26T10:17:24.408+10:00",
                "updated_at": "2016-02-08T12:31:55.640+10:00"
            }
        }

    };

    var _;



    describe("Non-zoom style tile generation (tileSize = 60px)", function () {
        const resolution = 60;
        var workingExamples;

        beforeEach(inject(["lodash", "casingTransformers", "baw.models.AudioRecordingCore", function (lodash, casingTransformers, AudioRecordingCore) {
            workingExamples = {};
            for (let key of Object.keys(examples)) {
                let recased = casingTransformers.transformObject(examples[key].data, casingTransformers.camelize);
                workingExamples[key]= {data: AudioRecordingCore.make(recased)};
            }

            _ = lodash;
        }]));

        var tilingFunctions;
        beforeEach(inject(["d3", "distributionTilingFunctions", function (d3, TilingFunctions) {
            let xScale = d3.time.scale(),
                yScale = d3.scale.linear(),
                tileCache = new WeakMap(),
                tileSizePixels = 60;

            let dataFunctions = {
                getId: (source) => source.id,
                getLow: function (d) {
                    return d.recordedDateMilliseconds;
                },
                getHigh: function (d) {
                    return d.recordedEndDateMilliSeconds;
                }
            };

            tilingFunctions = new TilingFunctions(
                dataFunctions, yScale, xScale, tileCache, d3.scale.identity(), tileSizePixels, false);

        }]));


        it("produces the correct tiles, where duration is less than nice value", function () {
            let expected = [
                {
                    offset: new Date("2012-10-12T14:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-12T15:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.belowDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2012-10-12T15:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-12T16:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.belowDuration.data,
                    zoomStyleImage: false
                }
            ];

            let actual = tilingFunctions.splitIntoTiles(workingExamples.belowDuration.data, resolution);

            compareTileSets(actual, expected);
        });

        it("produces the correct tiles, where duration is higher than nice value", function () {
            let expected = [
                {
                    offset: new Date("2012-10-19T04:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-19T05:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.slightlyAboveDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2012-10-19T05:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-19T06:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.slightlyAboveDuration.data,
                    zoomStyleImage: false
                }
            ];

            let actual = tilingFunctions.splitIntoTiles(workingExamples.slightlyAboveDuration.data, resolution);

            compareTileSets(actual, expected);
        });

        it("produces the correct tiles, where duration is exactly a nice value", function () {
            let expected = [
                {
                    offset: new Date("2015-12-17T19:00:00.000+10:00"),
                    offsetEnd: new Date("2015-12-17T20:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.perfectDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2015-12-17T20:00:00.000+10:00"),
                    offsetEnd: new Date("2015-12-17T21:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.perfectDuration.data,
                    zoomStyleImage: false
                }
            ];

            let actual = tilingFunctions.splitIntoTiles(workingExamples.perfectDuration.data, resolution);

            compareTileSets(actual, expected);
        });

        it("produces the correct tiles, when not on hour, where duration is less than nice value", function () {
            let expected = [
                {
                    offset: new Date("2012-10-12T14:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-12T15:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourBelowDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2012-10-12T15:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-12T16:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourBelowDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2012-10-12T16:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-12T17:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourBelowDuration.data,
                    zoomStyleImage: false
                }
            ];

            let actual = tilingFunctions.splitIntoTiles(workingExamples.notOnHourBelowDuration.data, resolution);

            compareTileSets(actual, expected);
        });

        it("produces the correct tiles, when not on hour, where duration is higher than nice value", function () {
            let expected = [
                {
                    offset: new Date("2012-10-19T04:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-19T05:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourSlightlyAboveDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2012-10-19T05:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-19T06:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourSlightlyAboveDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2012-10-19T06:00:00.000+10:00"),
                    offsetEnd: new Date("2012-10-19T07:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourSlightlyAboveDuration.data,
                    zoomStyleImage: false
                }
            ];

            let actual = tilingFunctions.splitIntoTiles(workingExamples.notOnHourSlightlyAboveDuration.data, resolution);

            compareTileSets(actual, expected);
        });

        it("produces the correct tiles, when not on hour, where duration is exactly a nice value", function () {
            let expected = [
                {
                    offset: new Date("2015-12-17T19:00:00.000+10:00"),
                    offsetEnd: new Date("2015-12-17T20:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourPerfectDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2015-12-17T20:00:00.000+10:00"),
                    offsetEnd: new Date("2015-12-17T21:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourPerfectDuration.data,
                    zoomStyleImage: false
                },
                {
                    offset: new Date("2015-12-17T21:00:00.000+10:00"),
                    offsetEnd: new Date("2015-12-17T22:00:00.000+10:00"),
                    resolution: 60,
                    source: workingExamples.notOnHourPerfectDuration.data,
                    zoomStyleImage: false
                }
            ];

            let actual = tilingFunctions.splitIntoTiles(workingExamples.notOnHourPerfectDuration.data, resolution);

            compareTileSets(actual, expected);
        });

        function compareTileSets(actual, expected) {
            expect(actual.length).toBe(expected.length);

            let merged = _.zip(actual, expected);

            for (let [actualTile, expectedTile] of merged) {
                compareTiles(actualTile, expectedTile);
            }
        }

        function compareTiles(actual, expected) {
            expect(+actual.offset).toBe(+expected.offset);
            expect(+actual.offsetEnd).toBe(+expected.offsetEnd);
            expect(actual.resolution).toBe(expected.resolution);
            expect(actual.source.id).toBe(expected.source.id);
            expect(actual.zoomStyleImage).toBe(expected.zoomStyleImage);
        }
    });
});