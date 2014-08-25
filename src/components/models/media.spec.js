describe("The Media object", function () {

    var existingMedia;
    var resource = {
        "recording": {
            "id": 234234,
            "uuid": "7de42123-c14e-4c10-afdf-8badd894864f",
            "recorded_date": "2012-10-20T06:00:00+10:00",
            "duration_seconds": 7199.004,
            "sample_rate_hertz": 22050,
            "channel_count": 2,
            "media_type": "audio/wav"
        },
        "common_parameters": {
            "start_offset": 0.0,
            "end_offset": 30.0,
            "audio_event_id": null,
            "channel": 0,
            "sample_rate": 22050
        },
        "available": {
            "audio": {
                "mp3": {
                    "media_type": "audio/mp3",
                    "extension": "mp3",
                    "url": "/audio_recordings/234234/media.mp3?end_offset=30\u0026start_offset=0"
                },
                "webm": {
                    "media_type": "audio/webm",
                    "extension": "webm",
                    "url": "/audio_recordings/234234/media.webm?end_offset=30\u0026start_offset=0"
                },
                "ogg": {
                    "media_type": "audio/ogg",
                    "extension": "ogg",
                    "url": "/audio_recordings/234234/media.ogg?end_offset=30\u0026start_offset=0"
                },
                "flac": {
                    "media_type": "audio/x-flac",
                    "extension": "flac",
                    "url": "/audio_recordings/234234/media.flac?end_offset=30\u0026start_offset=0"
                },
                "wav": {
                    "media_type": "audio/wav",
                    "extension": "wav",
                    "url": "/audio_recordings/234234/media.wav?end_offset=30\u0026start_offset=0"
                }
            },
            "image": {
                "png": {
                    "window_size": 512,
                    "window_function": "Hamming",
                    "colour": "g",
                    "ppms": 0.04306640625,
                    "media_type": "image/png",
                    "extension": "png",
                    "url": "/audio_recordings/234234/media.png?end_offset=30\u0026start_offset=0"
                }
            },
            "text": {
                "json": {
                    "media_type": "application/json",
                    "extension": "json",
                    "url": "/audio_recordings/234234/media.json?end_offset=30\u0026start_offset=0"
                }
            }
        }
    };


    beforeEach(function () {
        existingMedia = new baw.Media(resource);
    });

    it("should be found globally", function () {
        var type = typeof baw.Media;
        expect(type).toEqual("function");
    });


    it("will encode the datetime as a date", function() {
        var datetime = existingMedia.datetime;

        var instanceOfDate = datetime instanceof Date;
        expect(instanceOfDate).toBeTrue();
    });
});