describe("The unitConverter service", function () {

    var $injector = angular.injector(["bawApp.services.unitConverter"]);
    var unitConverter;
    var inputArgs = {
        sampleRate: null,
        spectrogramWindowSize: null,
        endOffset: null,
        startOffset: null,
        imageElement: null
    };

    beforeEach(function () {
        unitConverter = $injector.get("bawApp.services.unitConverter");
    });

    describe("returns an object", function () {
        expect(unitConverter).toBeObject();
    });

    describe("has one method", function () {
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
        delete obj[keys[rand]];

        var f = function() {
            unitConverter.getConversions(obj);
        };

        expect(f).toThrowError("Missing information for property: " + keys[rand]);
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

            expect(converters.arguments).toBe(inputArgs);
        });

        it("returns an object that implements the required API", function () {
            
            expect(converters).toImplement({
                arguments: {},
                conversions: {},
                pixelsToSeconds: angular.noop,
                secondsToPixels: angular.noop,
                hertzToPixels: angular.noop,
                invertHertz: angular.noop,
                invertPixels: angular.noop
            });
        });

        it("ensures the conversion object has the correct value for pixelsPerSecond", function () {
            expect(converters.conversions.pixelsPerSecond).toBe();
        });

        it("ensures the conversion object has the correct value for pixelsPerSecond", function () {
            expect(converters.conversions.pixelsPerSecond).toBe();
        });

        it("ensures the conversion object has the correct value for pixelsPerSecond", function () {
            expect(converters.conversions.pixelsPerSecond).toBe();
        });

        it("ensures the conversion object has the correct value for pixelsPerSecond", function () {
            expect(converters.conversions.pixelsPerSecond).toBe();
        });

        it("ensures the conversion object has an ideal width", function () {
            expect(converters.conversions.pixelsPerSecond).toBe();
        });

        it("ensures the conversion object has an ideal height", function () {
            expect(converters.conversions.pixelsPerSecond).toBe();
        });



    });


});