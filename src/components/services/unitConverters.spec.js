describe("The unitConverter service", function () {

    var unitConverter;
    var inputArgs = {};

    beforeEach(module('bawApp.services.unitConverter'));

    beforeEach(inject(["bawApp.unitConverter", function (providedUnitConverted) {
        unitConverter = providedUnitConverted;

        inputArgs = {
            sampleRate: undefined,
            spectrogramWindowSize: undefined,
            endOffset: undefined,
            startOffset: undefined,
            imageElement: undefined,
            audioRecordingAbsoluteStartDate: undefined
        };
    }]));

    it("returns an object", function () {
        expect(unitConverter).toBeObject();
    });

    it("has one method", function () {
        var keys = Object.keys(unitConverter);

        expect(keys.length).toBe(1);
        expect(keys[0]).toBe("getConversions");
    });

    it("will accepted one well formatted argument", function () {
        var c = unitConverter.getConversions(inputArgs);

        expect(c).toBeObject();
    });


    Object.keys(inputArgs).forEach(function (key) {
        it("fails iff the input object is missing the " + key + " property", function () {
            var obj = angular.copy(inputArgs);
            delete obj[key];

            var f = function () {
                unitConverter.getConversions(obj);
            };

            expect(f).toThrowError(Error, "Missing property: " + key);
        });

    });

    describe("has the getConversions method:", function () {
        var converters;
        var now = new Date();

        beforeEach(function () {
            inputArgs.sampleRate = 22050;
            inputArgs.spectrogramWindowSize = 512;
            inputArgs.endOffset = 65;
            inputArgs.startOffset = 35;
            inputArgs.imageElement = null;
            inputArgs.audioRecordingAbsoluteStartDate = now;

            converters = unitConverter.getConversions(inputArgs);
        });

        it("the input object to be embedded in the output", function () {
            expect(converters.input).toBe(inputArgs);
        });

        ["sampleRate", "spectrogramWindowSize", "startOffset", "endOffset"].forEach(function (key) {
            it("requires " + key + " be provided as a number", function () {

                var f = function () {
                    var local = angular.extend({}, inputArgs);
                    local[key] = inputArgs[key].toString();
                    unitConverter.getConversions(local);
                };

                expect(f).toThrowError("Input data field `" + key + "` should be a number!");
            });
        });

        it("ensure the absolute start date of the input object is output and is a date", function(){
            var isDate = converters.input.audioRecordingAbsoluteStartDate instanceof Date;

            expect(isDate).toBeTrue();

            expect(converters.input.audioRecordingAbsoluteStartDate).toBe(now);

        });

        it("returns an object that implements the required API", function () {
            expect(converters).toImplement({
                input: {},
                conversions: {},
                pixelsToSeconds: angular.noop,
                secondsToPixels: angular.noop,
                hertzToPixels: angular.noop,
                invertHertz: angular.noop,
                invertPixels: angular.noop
            });
        });

        it("ensures the conversion object has the correct value for pixelsPerSecond", function () {
            expect(converters.conversions.pixelsPerSecond).toBe(43.06640625);
        });

        it("ensures the conversion object has the correct value for pixelsPerHertz", function () {
            expect(converters.conversions.pixelsPerHertz).toBe(0.02321995464852607709750566893424);
        });

        it("ensures the conversion object has the correct value for nyquistFrequency", function () {
            expect(converters.conversions.nyquistFrequency).toBe(11025);
        });

        it("ensures the conversion object has the correct value for enforcedImageWidth", function () {
            expect(converters.conversions.enforcedImageWidth).toBe(1292);
        });

        it("ensures the conversion object has the correct value for enforcedImageHeight", function () {
            expect(converters.conversions.enforcedImageHeight).toBe(256);
        });

        it("correctly converts seconds to pixels", function () {

            var pixels = converters.secondsToPixels(120);

            expect(pixels).toBe(5167.96875);
        });

        it("correctly converts Hertz to pixels", function () {

            var pixels = converters.hertzToPixels(5000);

            expect(pixels).toBe(116.09977324263039);
        });

        it("correctly converts pixels to seconds", function () {

            var pixels = converters.pixelsToSeconds(1000);

            expect(pixels).toBe(23.219954649 /* 23.219954648526077 */);
        });

        it("correctly converts pixels to Hertz", function () {

            var pixels = converters.pixelsToHertz(128);

            expect(pixels).toBe(5512.5 /* 5512.5 */);
        });

        it("correctly inverts hertz", function () {

            var pixels = converters.invertHertz(1000);

            expect(pixels).toBe(10025);
        });

        it("correctly inverts pixels", function () {

            var pixels = converters.invertPixels(200);

            expect(pixels).toBe(56);
        });

        it("correctly sets width and height given a stretched image", function () {
            inputArgs.imageElement = {src: "boobies", naturalWidth: 1200, naturalHeight: 250 };

            converters = unitConverter.getConversions(inputArgs);

            expect(converters.conversions.enforcedImageWidth).toBe(1292);
            expect(converters.conversions.enforcedImageHeight).toBe(256);
        });


        it("correctly calculates the left position of a box - with start offset", function () {
            var left = converters.toLeft(45.0 /*seconds*/);
            expect(left).toBe(430.6640625 /*pixels*/);
        });

        it("correctly calculates the left position of a box - less than start offset", function () {
            var left = converters.toLeft(15.0 /*seconds*/);
            expect(left).toBe(-861.328125 /*pixels*/);
        });

        it("correctly calculates the left position of a box - greater than offset", function () {
            var left = converters.toLeft(92.0 /*seconds*/);
            expect(left).toBe(2454.78515625);
        });

        it("correctly calculates the top position of a box", function () {
            var top = converters.toTop(10000 /*hertz*/);

            // remember - inverted y axis
            expect(top).toBe(23.800453514739218 /*pixels*/);
        });

        it("correctly calculates the top position of a box - if for some reason the annotation high frequency is above the nyquist", function () {
            var top = converters.toTop(16000 /*hertz*/);

            // remember - inverted y axis
            expect(top).toBe(-115.51927437641723 /*pixels*/);
        });


        it("correctly calculates the width of a box", function () {
            var width = converters.toWidth(32, 16 /*seconds*/);
            expect(width).toBe(689.0625 /*pixels*/);
        });

        it("correctly calculates the height of a box", function () {
            var height = converters.toHeight(5000, 1500 /*hertz*/);
            expect(height).toBe(81.26984126984127 /*pixels*/);
        });

        it("correctly calculates the startSeconds for and audioEvent from the left position of a box - with start offset",
            function () {
                var start = converters.toStart(650 /*pixels*/);
                expect(start).toBe(50.092970522 /*seconds (unrounded = 50.09297052154195)*/);
            });

        it("correctly calculates the startSeconds for and audioEvent from the left position of a box - with pos+ pixels",
            function () {
                var start = converters.toStart(2500 /*pixels*/);
                expect(start).toBe(93.049886621 /*seconds (unrounded = 93.0498866213152)*/);
            });


        it("correctly calculates the startSeconds for and audioEvent from the left position of a box - with negative pixels",
            function () {
                var start = converters.toStart(-860 /*pixels*/);
                expect(start).toBeCloseTo(15.031,3 /*seconds (unrounded = 15.030839002267573)*/);
            });

        it("correctly calculates the endSeconds for an audioEvent from the left position of a box and its width", function () {
            var end = converters.toEnd(650, 43.06640625 /*pixels*/);
            expect(end).toBe(51.092970522 /*seconds (unrounded = 51.09297052154195)*/);
        });

        it("correctly calculates the lowFrequency for an audioEvent from the top position of a box and its width", function () {
            var low = converters.toLow(20, 50 /*pixels*/);
            expect(low).toBe(8010.351563 /*hertz (unrounded = 8010.3515625)*/);
        });

        it("correctly calculates the highFrequency for an audioEvent from the top position of a box", function () {
            var high = converters.toHigh(20 /*pixels*/);
            expect(high).toBe(10163.671875 /*hertz (unrounded = 10163.671875)*/);
        });

    });


});