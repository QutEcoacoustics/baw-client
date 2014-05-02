describe("The Media object", function () {

    var existingMedia;
    var resource = {
        "datetime": "2007-10-21T14:46:07+10:00",
        "originalFormat": ".asf",
        "originalSampleRate": 22050,
        "startOffset": 47.0,
        "endOffset": 51.0,
        "uuid": "5151512c-332b-470a-8a29-b7d46b0a9791",
        "id": 3952,
        "mediaType": "application/json",
        "availableAudioFormats": {
            "mp3": {
                "extension": "mp3",
                "channel": 0,
                "sampleRate": 22050,
                "maxDurationSeconds": 300.0,
                "minDurationSeconds": 0.5,
                "mimeType": "audio/mp3",
                "url": "/audio_recordings/3952/media.mp3?end_offset=51&start_offset=47"},
            "webm": {
                "extension": "webm",
                "channel": 0,
                "sampleRate": 22050,
                "maxDurationSeconds": 300.0,
                "minDurationSeconds": 0.5,
                "mimeType": "audio/webm",
                "url": "/audio_recordings/3952/media.webm?end_offset=51&start_offset=47"},
            "ogg": {
                "extension": "ogg",
                "channel": 0,
                "sampleRate": 22050,
                "maxDurationSeconds": 300.0,
                "minDurationSeconds": 0.5,
                "mimeType": "audio/ogg",
                "url": "/audio_recordings/3952/media.ogg?end_offset=51&start_offset=47"},
            "flac": {
                "extension": "flac",
                "channel": 0,
                "sampleRate": 22050,
                "maxDurationSeconds": 300.0,
                "minDurationSeconds": 0.5,
                "mimeType": "audio/x-flac",
                "url": "/audio_recordings/3952/media.flac?end_offset=51&start_offset=47"},
            "wav": {
                "extension": "wav",
                "channel": 0,
                "sampleRate": 22050,
                "maxDurationSeconds": 300.0,
                "minDurationSeconds": 0.5,
                "mimeType": "audio/wav",
                "url": "/audio_recordings/3952/media.wav?end_offset=51&start_offset=47"}
        },
        "availableImageFormats": {
            "png": {
                "extension": "png",
                "channel": 0,
                "sampleRate": 22050,
                "window": 512,
                "windowFunction": "Hamming",
                "colour": "g",
                "ppms": 0.045,
                "maxDurationSeconds": 120.0,
                "minDurationSeconds": 0.5,
                "mimeType": "image/png",
                "url": "/audio_recordings/3952/media.png?end_offset=51&start_offset=47"}
        },
        "availableTextFormats": {
            "json": {
                "extension": "json",
                "mimeType": "application/json",
                "url": "/audio_recordings/3952/media.json?end_offset=51&start_offset=47"
            }
        },
        "format": "json"};


    beforeEach(function () {
        existingMedia = new baw.Media(resource);
    });

    it("should be found globally", function () {
        var type = typeof baw.Media;
        expect(type).toEqual("function");
    });
});