describe("The analysis result file service", function () {

    var $url, provider, AnalysisResultFile, root;

    var audioRecording = {
        id: 188263,
        uuid: "b03685fe-6ad5-4776-90b7-e2c271dad3fb",
        recordedDate: new Date("2010-10-14T00:00:00.000+10:00")
    };

    beforeEach(module("rails", "url", "bawApp.services", function ($urlProvider) {
        provider = $urlProvider;
    }));

    beforeEach(inject(["$url",
                       "conf.paths",
                       "AnalysisResultFile",
                       function (providedUrl, paths, providedAnalysisResultFile) {
                           $url = providedUrl;
                           root = paths.api.root;
                           AnalysisResultFile = providedAnalysisResultFile;
                       }]));

    it("returns an object", function () {
        expect(AnalysisResultFile).toBeObject();
    });


    it("can return a long duration image", function () {
        var actual = AnalysisResultFile.getLongDurationImage(audioRecording);

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__ACI-ENT-EVN.png";

        expect(actual).toBe(url);
    });

    it("will validate the audio recordings argument has an integer id", function () {
        expect(function () {
            AnalysisResultFile.getLongDurationImage({
                uuid: audioRecording.uuid,
                recordedDate: audioRecording.recordedDate
            });
        }).toThrowError(Error, "Expected an audio recording to have an id");

        expect(function () {
            AnalysisResultFile.getLongDurationImage({
                id: "test",
                uuid: audioRecording.uuid,
                recordedDate: audioRecording.recordedDate
            });
        }).toThrowError(Error, "Expected an audio recording to have an id");
    });

    it("will validate the audio recordings argument has an uuid", function () {
        expect(function () {
            AnalysisResultFile.getLongDurationImage({id: audioRecording.id, recordedDate: audioRecording.recordedDate});
        }).toThrowError(Error, "Expected an audio recording to have a uuid");

        expect(function () {
            AnalysisResultFile.getLongDurationImage({
                id: audioRecording.id,
                uuid: "not-one",
                recordedDate: audioRecording.recordedDate
            });
        }).toThrowError(Error, "Expected an audio recording to have a uuid");

        expect(function () {
            AnalysisResultFile.getLongDurationImage({
                id: audioRecording.id,
                uuid: "1234566789012345678901234567890123456",
                recordedDate: audioRecording.recordedDate
            });
        }).toThrowError(Error, "Expected an audio recording to have a uuid");
    });

    it("will validate the audio recordings argument has a recorded date value", function () {
        expect(function () {
            AnalysisResultFile.getLongDurationImage({id: audioRecording.id, uuid: audioRecording.uuid});
        }).toThrowError(Error, "Expected audio recording to have a valid recorded date");

        expect(function () {
            AnalysisResultFile.getLongDurationImage({
                id: audioRecording.id,
                uuid: audioRecording.uuid,
                recordedDate: "2010-10-14T00:00:00.000+10:00"
            });
        }).toThrowError(Error, "Expected audio recording to have a valid recorded date");
    });

    it("can return a long duration image - of a different type", function () {
        var actual = AnalysisResultFile.getLongDurationImage(audioRecording, "BGN-POW-CVR");

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__BGN-POW-CVR.png";

        expect(actual).toBe(url);
    });

    it("ensures the subfolder argument works", function () {
        var actual = AnalysisResultFile.getLongDurationImage(audioRecording, "BGN-POW-CVR", "ARBITRARY_PATH_FRAGMENT");

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/ARBITRARY_PATH_FRAGMENT/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__BGN-POW-CVR.png";

        expect(actual).toBe(url);
    });

    it("can return a long duration image - of a different type but only valid types", function () {
        expect(function () {
            AnalysisResultFile.getLongDurationImage(audioRecording, "not-a-type");
        }).toThrowError(Error, "Expected a known image type");
    });

    it("it uses the same logic to return a long duration image tile", function () {
        spyOn(AnalysisResultFile, "getLongDurationImageTile");

        AnalysisResultFile.getLongDurationImageTile(audioRecording);

        expect(AnalysisResultFile.getLongDurationImageTile).toHaveBeenCalled();
    });

    it("will validate the tile date argument is a date", function () {
        expect(function () {
            AnalysisResultFile.getLongDurationImageTile();
        }).toThrowError(Error, "Expected a valid tile date argument");

        expect(function () {
            var tileDate = "2010-10-14T00:00:00.000+10:00";
            AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate);
        }).toThrowError(Error, "Expected a valid tile date argument");
    });

    it("can return a long duration image tile", function () {
        var tileDate = new Date("2010-10-14T12:00:00.000+10:00");
        var actual = AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate);

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__ACI-ENT-EVN.Tile_20101014-020000Z_60.png";

        expect(actual).toBe(url);
    });

    it("supports sub-second datetimes for tiles", function () {
        var tileDate = new Date("2010-10-14T12:00:00.123+10:00");
        var actual = AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate);

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__ACI-ENT-EVN.Tile_20101014-020000.123Z_60.png";

        expect(actual).toBe(url);
    });

    it("supports sub-second datetimes for tiles and strips trailing zeros", function () {
        var tileDate = new Date("2010-10-14T12:00:00.120+10:00");
        var actual = AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate);

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__ACI-ENT-EVN.Tile_20101014-020000.12Z_60.png";

        expect(actual).toBe(url);
    });

    it("will validate the tile resolution argument is a number", function () {
        expect(function () {
            var tileDate = new Date("2010-10-14T00:00:00.000+10:00");
            AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate, "not a number");
        }).toThrowError(Error, "Expected a valid tile resolution");
    });

    it("can return a long duration image tile - of a different resolution", function () {
        var tileDate = new Date("2010-10-14T12:00:00.000+10:00");
        var actual = AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate, 0.02);

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__ACI-ENT-EVN.Tile_20101014-020000Z_0.02.png";

        expect(actual).toBe(url);
    });

    it("can return a long duration image tile - of a different type", function () {
        var tileDate = new Date("2010-10-14T12:00:00.000+10:00");
        var actual = AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate, undefined, "BGN-POW-CVR");

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__BGN-POW-CVR.Tile_20101014-020000Z_60.png";

        expect(actual).toBe(url);
    });

    it("ensures the zooming switch overrides image type", function () {
        var tileDate = new Date("2010-10-14T12:00:00.000+10:00");
        var actual = AnalysisResultFile.getLongDurationImageTile(audioRecording, tileDate, 0.02, "BGN-POW-CVR", true);

        var url = root + "/analysis_jobs/system/results/188263/Towsey.Acoustic/ZoomingTiles/b03685fe-6ad5-4776-90b7-e2c271dad3fb_20101013-140000Z__BLENDED.Tile_20101014-020000Z_0.02.png";

        expect(actual).toBe(url);
    });


});
