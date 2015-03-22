describe("The service suite", function () {

    var audioEventService;
    var pathService;

    beforeEach(module("bawApp.models", "rails"));
    beforeEach(module("bawApp.services"));

    beforeEach(inject(["AudioEvent", "conf.paths", function (AudioEvent, paths) {
        audioEventService = AudioEvent;
        pathService = paths;


    }]));

    it("should format the csv link correctly", function () {
        var parameters = {
            projectId: 12,
            siteId: 13,
            recordingId: 42,
            startOffset: 123456,
            endOffset: 654321
        };

        var expected = pathService.api.root + "/audio_recordings/42/audio_events/download.csv?projectId=12&siteId=13&startOffset=123456&endOffset=654321";

        var actual = audioEventService.csvLink(parameters);

        expect(actual).toBe(expected);
    });


    it("should format the csv link correctly with an empty parameter set", function () {
        var parameters;
        var expected = pathService.api.root + "/audio_recordings//audio_events/download.csv";

        var actual = audioEventService.csvLink(parameters);

        expect(actual).toBe(expected);

    });

});