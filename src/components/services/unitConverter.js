var uc = angular.module("bawApp.services.unitConverter", ["bawApp.configuration"]);

uc.factory("bawApp.unitConverter", ['conf.constants', function (constants) {

    function variance(x, y) {
        var fraction = x / y;
        return Math.abs(fraction - 1);
    }

    function calculateUnitConversions(sampleRate, window, duration, image) {
        if (sampleRate === undefined || window === undefined || duration === undefined) {
            console.warn("unitConverter:calculateUnitConversions: not enough information available to calculate unit conversions");
            return { pixelsPerSecond: NaN, pixelsPerHertz: NaN};
        }

        // based on meta data only
        var nyquistFrequency = (sampleRate / 2.0),
            idealPps = sampleRate / window,
            idealWidth = duration * idealPps,
            idealHeight = window / 2.0,
            idealPph = idealHeight / nyquistFrequency;

        var result = {
            pixelsPerSecond: idealPps,
            pixelsPerHertz: idealPph,
            nyquistFrequency: nyquistFrequency,
            enforcedImageWidth: idealWidth,
            enforcedImageHeight: idealHeight
        };

        if (image.src) {
            var imageHeight = image.naturalHeight,
                imageWidth = image.naturalWidth;

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
                        "px) for image " + image.src +
                        " is not a power of two. The image has been STRETCHED to " + croppedHeight + "px! ALL MEASUREMENTS ON THIS SPECTROGRAM WILL BE WRONG!");

                    // squish image into the nearest 'correct height' to minimise damage
                    result.enforcedImageHeight = imageHeight = croppedHeight;
                }


                // use the image width to estimate the actual shown duration
                var spectrogramBasedAudioLength = (imageWidth * window) / sampleRate,
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

    function calculateUnitConverters(mediaObject, image) {
        var conversions = {};

        if (mediaObject && mediaObject.spectrogram) {
            conversions = calculateUnitConversions(mediaObject.sampleRate, mediaObject.spectrogram.window,
                (mediaObject.endOffset - mediaObject.startOffset), image);
        }

        var PRECISION = constants.precision;

        return {
            arguments: mediaObject,
            conversions: conversions,
            pixelsToSeconds: function pixelsToSeconds(pixels) {
                var seconds = pixels / conversions.pixelsPerSecond;
                return seconds;
            },
            pixelsToHertz: function pixelsToHertz(pixels) {
                var hertz = pixels / conversions.pixelsPerHertz;
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
    }

    return {
        getConversions: calculateUnitConverters
    };
}]);