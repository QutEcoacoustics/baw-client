describe("The unitConverter service", function () {

    var unitConverter;
    var inputArgs;

    beforeEach(module('bawApp.services.unitConverter'));

    beforeEach( inject(["bawApp.unitConverter", function (providedUnitConverted) {
        unitConverter = providedUnitConverted;

        inputArgs = {
            sampleRate: null,
            spectrogramWindowSize: null,
            endOffset: null,
            startOffset: null,
            imageElement: null
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

    it("fails iff the input object is missing properties", function () {
        var keys = Object.keys(inputArgs);
        var rand = Math.randomInt(0, keys.length);
        var obj = angular.copy(inputArgs);
        delete obj[keys[rand - 1]];

        var f = function() {
            unitConverter.getConversions(obj);
        };

        expect(f).toThrowError("Missing property: " + keys[rand]);
    });

    describe("has the getConversions method:", function () {
        var converters;

        beforeEach(function () {
            inputArgs.sampleRate = 22050;
            inputArgs.spectrogramWindowSize = 512;
            inputArgs.endOffset = 65;
            inputArgs.startOffset = 35;
            inputArgs.imageElement = null;

            converters = unitConverter.getConversions(inputArgs);
        });

        it("the input object to be embedded in the output", function () {
            expect(converters.input).toBe(inputArgs);
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

            expect(pixels).toBe(23.219954648526077);
        });

        it("correctly converts pixels to Hertz", function () {

            var pixels = converters.pixelsToHertz(128);

            expect(pixels).toBe(5512.5);
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


        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

        it("correctly calculates the left position of a box", function () {
            expect().toBeTrue();
        });

    });


});