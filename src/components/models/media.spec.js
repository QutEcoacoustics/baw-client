describe("The Media object", function () {

    var existingMedia;
    var response = {
        "meta": {
            "status": 200,
            "message": "OK"
        },
        "data": {
            "recording": {
                "id": 234234,
                "uuid": "7de42123-c14e-4c10-afdf-8badd894864f",
                "recorded_date": "2012-10-20T06:00:00+10:00",
                "duration_seconds": 7199.004,
                "sample_rate_hertz": 22050,
                "channel_count": 2,
                "media_type": "audio\/wav"
            },
            "common_parameters": {
                "start_offset": 0,
                "end_offset": 30,
                "audio_event_id": null,
                "channel": 0,
                "sample_rate": 22050
            },
            "available": {
                "audio": {
                    "mp3": {
                        "media_type": "audio\/mp3",
                        "extension": "mp3",
                        "url": "\/audio_recordings\/234234\/media.mp3?end_offset=30&start_offset=0"
                    },
                    "webm": {
                        "media_type": "audio\/webm",
                        "extension": "webm",
                        "url": "\/audio_recordings\/234234\/media.webm?end_offset=30&start_offset=0"
                    },
                    "ogg": {
                        "media_type": "audio\/ogg",
                        "extension": "ogg",
                        "url": "\/audio_recordings\/234234\/media.ogg?end_offset=30&start_offset=0"
                    },
                    "flac": {
                        "media_type": "audio\/x-flac",
                        "extension": "flac",
                        "url": "\/audio_recordings\/234234\/media.flac?end_offset=30&start_offset=0"
                    },
                    "wav": {
                        "media_type": "audio\/wav",
                        "extension": "wav",
                        "url": "\/audio_recordings\/234234\/media.wav?end_offset=30&start_offset=0"
                    }
                },
                "image": {
                    "png": {
                        "window_size": 512,
                        "window_function": "Hamming",
                        "colour": "g",
                        "ppms": 0.04306640625,
                        "media_type": "image\/png",
                        "extension": "png",
                        "url": "\/audio_recordings\/234234\/media.png?end_offset=30&start_offset=0"
                    }
                },
                "text": {
                    "json": {
                        "media_type": "application\/json",
                        "extension": "json",
                        "url": "\/audio_recordings\/234234\/media.json?end_offset=30&start_offset=0"
                    }
                }
            }
        }
    };
    var Media;

    beforeEach(function(){
        module("rails");

        module("url", function(casingTransformers, $urlProvider) {
            $urlProvider.renamer(function  (key) { return  casingTransformers.underscore(key);});
        });

        module("rails");
        module("http-auth-interceptor");
        module("bawApp.services");
        module("baw.models");
        module(function ($provide) {
            $provide.value("Authenticator", {authToken:"67tgfyb7i6tgyu"});
        });
    });

    beforeEach(inject(["casingTransformers", "baw.models.Media", function (casingTransformers, _media) {
        Media = _media;
        var transformed = casingTransformers.transformObject(response, casingTransformers.camelize);
        existingMedia = new Media(transformed.data);
    }]));

    it("should be not be found globally", function () {
        var type = typeof Media;
        expect(type).toEqual("function");
    });


    it("will encode the datetime as a date", function() {
        var datetime = existingMedia.recording.recordedDate;

        var instanceOfDate = datetime instanceof Date;
        expect(instanceOfDate).toBeTrue();
    });

    it("will append the token onto all urls", function() {
        var token = "user_token=67tgfyb7i6tgyu";
        var keys = ["audio", "image", "text"];

        function checkUrls(mediaType) {
            var obj = existingMedia.available[mediaType];
            angular.forEach(obj, function (value, mimeType) {
                var tokenIncluded = value.url.indexOf(token) >= 0;

                expect(tokenIncluded).toBeTrue("(url did not contain token - `" + value.url + "` )");
            });
        }

        keys.map(checkUrls);
    });
});