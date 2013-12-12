var uc = angular.module("bawApp.services.unitConverter", ["bawApp.configuration"]);

uc.factory("bawApp.unitConverter", ['conf.constants', function (constants) {

    function variance(x, y) {
        var fraction = x / y;
        return Math.abs(fraction - 1);
    }

    function calculateUnitConversions(data) {
        var result = {
            pixelsPerSecond: NaN,
            pixelsPerHertz: NaN,
            nyquistFrequency: NaN,
            enforcedImageWidth: NaN,
            enforcedImageHeight: NaN
        };
        
        if (data.sampleRate === undefined ||
            data.spectrogramWindowSize === undefined ||
            data.startOffset === undefined ||
            data.startOffset === undefined ||
            data.endOffset === undefined) {
            console.warn("unitConverter:calculateUnitConversions: not enough information available to calculate unit conversions");
            return result;
        }

        // based on meta data only
        var duration = data.endOffset - data.startOffset,
            nyquistFrequency = (data.sampleRate / 2.0),
            idealPps = data.sampleRate / data.spectrogramWindowSize,
            idealWidth = duration * idealPps,
            idealHeight = data.spectrogramWindowSize / 2.0,
            idealPph = idealHeight / nyquistFrequency;

       
        result.pixelsPerSecond = idealPps;
        result.pixelsPerHertz = idealPph;
        result.nyquistFrequency = nyquistFrequency;
        result.enforcedImageWidth = Math.round(idealWidth);
        result.enforcedImageHeight = idealHeight;

        if (data.imageElement && data.imageElement.src) {
            var imageHeight = data.imageElement.naturalHeight,
                imageWidth = data.imageElement.naturalWidth;

            // invariant
            if (imageHeight === undefined || imageWidth === undefined) {
                // TODO: handle better
                throw "unitConverter:calculateUnitConversions: can't determine natural height or natural width of source image!";
            }

            // only process if image is loaded
            if (imageHeight && imageWidth) {
                // crop images that are too tall - specifically for removing DC values
                if (!baw.isPowerOfTwo(imageHeight)) {
                    var croppedHeight = baw.closestPowerOfTwoBelow(imageHeight);
                    console.error("unitConverter:calculateUnitConversions: The natural height (" + imageHeight +
                        "px) for image " + data.imageElement.src +
                        " is not a power of two. The image has been STRETCHED to " + croppedHeight + "px! ALL MEASUREMENTS ON THIS SPECTROGRAM WILL BE WRONG!");

                    // squish image into the nearest 'correct height' to minimise damage
                    result.enforcedImageHeight = imageHeight = croppedHeight;
                }


                // use the image width to estimate the actual shown duration
                var spectrogramBasedAudioLength = (imageWidth * data.spectrogramWindowSize) / data.sampleRate,
                    spectrogramPps = imageWidth / spectrogramBasedAudioLength;

                // use the image height to estimate the actual shown frequency bounds
                var spectrogramPph = imageHeight / nyquistFrequency;

                // do consistency check (tolerance = 2%)
                var tolerance = 0.02;
                if (variance(idealPph, spectrogramPph) > tolerance) {
                    console.warn("unitConverter:calculateUniConversions: the image height does not conform well with the meta data. The image will be stretched to fit!",
                        idealPph, spectrogramPph);
                }
                if (variance(idealPps, spectrogramPps) > tolerance) {
                    console.warn("unitConverter:calculateUniConversions: the image width does not conform well with the meta data. The image will be stretched to fit!",
                        idealPps, spectrogramPps);
                }
            }
        }

        console.debug("unitConverter:calculateUnitConversions: unit update calculated successfully");
        return result;
    }

    var defaultArgs = {
        sampleRate: null,
        spectrogramWindowSize: null,
        endOffset: null,
        startOffset: null,
        imageElement: null
    };

    function calculateUnitConverters(inputData) {
        var conversions = {};

        if (inputData) {
            var defaultKeys = Object.keys(defaultArgs);
            for (var i = 0; i < defaultKeys.length; i++) {
                if (!inputData.hasOwnProperty(defaultKeys[i])) {
                    throw "Missing property: " + defaultKeys[i];
                }
            }

            conversions = calculateUnitConversions(inputData);
        }

        var pSeconds = Math.pow(10, constants.unitConverter.precisionSeconds);
        var pHertz = Math.pow(10, constants.unitConverter.precisionHertz);

        var functions = {
            input: inputData,
            conversions: conversions,
            pixelsToSeconds: function pixelsToSeconds(pixels) {
                var seconds = pixels / conversions.pixelsPerSecond;
                seconds = Math.round(seconds * pSeconds) / pSeconds;
                return seconds;
            },
            pixelsToHertz: function pixelsToHertz(pixels) {
                var hertz = pixels / conversions.pixelsPerHertz;
                hertz = Math.round(hertz * pHertz) / pHertz;
                return hertz;
            },
            secondsToPixels: function secondsToPixels(seconds) {
                var pixels = seconds * conversions.pixelsPerSecond;
                return pixels;
            },
            hertzToPixels: function hertzToPixels(hertz) {
                var pixels = hertz * conversions.pixelsPerHertz;
                return pixels;
            },
            invertHertz: function invertHertz(hertz) {
                return Math.abs(conversions.nyquistFrequency - hertz);
            },
            invertPixels: function invertPixels(pixels) {
                return Math.abs(conversions.enforcedImageHeight - pixels);
            }
        };

        functions.toLeft = function toLeft(startSeconds) {
            return functions.secondsToPixels(startSeconds - functions.input.startOffset);
        };
        functions.toTop = function toTop(highHertz) {
            return functions.invertPixels(functions.hertzToPixels(highHertz));
        };
        functions.toWidth = function toWidth(endSeconds, startSeconds) {
            return functions.secondsToPixels(endSeconds - startSeconds);
        };
        functions.toHeight = function toHeight(highHertz, lowHertz) {
            return functions.hertzToPixels(highHertz - lowHertz);
        };
        functions.toStart = function toStart(left) {
            return functions.input.startOffset + functions.pixelsToSeconds(left || 0.0);
        };
        functions.toEnd = function toEnd(left, width) {
            return functions.input.startOffset + functions.pixelsToSeconds((left || 0.0) + (width || 0.0));
        };
        functions.toLow = function toLow(top, height) {
            return functions.pixelsToHertz(
                functions.invertPixels(top || 0.0) - (height || 0.0)
            );

        };
        functions.toHigh = function toHigh(top) {
            return functions.pixelsToHertz(functions.invertPixels(top || 0.0));
        };


        return functions;
    }

    return {
        getConversions: calculateUnitConverters
    };
}]);