'use strict';

///**
// * String format function
// * http://www.isurinder.com/blog/post/2011/04/02/StringFormat-In-JavaScript.aspx#.UKWRyvgzpQs
// * @type {Function}
// */
//String.format = String.prototype.format = function() {
//    var i=0;
//    var string = (typeof(this) == "function" && !(i++)) ? arguments[0] : this;
//
//    for (; i < arguments.length; i++){
//        string = string.replace(/\{\d+?\}/, arguments[i]);
//    }
//
//    return string;
//};

/**
 * Generates a unique number for the page. Unique only for each refresh.
 * @return {*|number}
 * @constructor
 */
Number.Unique = function () {
    var i = Number.uniqueIncrementId || 0;
    i += 1;
    Number.uniqueIncrementId = i;
    return i;
};


/**
 * IndexOf Shim
 */
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (what, i) {
        i = i || 0;
        var L = this.length;
        while (i < L) {
            if (this[i] === what) return i;
            ++i;
        }
        return -1;
    };
}

/**
 * Array filter compatibility
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter
 */

if (!Array.prototype.filter) {
    Array.prototype.filter = function (fun /*, thisp */) {
        "use strict";

        if (this == null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}

/*!
 * requestAnimationFrame polyfill by Erik Möller, with fixes from Paul Irish, Tino Zijdel and Richard Fussenegger.
 *
 * I applied the following fixes:
 *   - Added names to the anonymous functions for better stack traces.
 *   - Indentation of code for better readability.
 *   - Combined all variable declarations into a single statement: performance.
 *
 * @link http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @link http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 *
 * https://gist.github.com/Fleshgrinder/4523839
 */
;
(function requestAnimationFramePolyfill() {
    var
        lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'];

    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function requestAnimationFrame(callback, element) {
            var
                currTime = new Date().getTime(),
                timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                id = window.setTimeout(function requestAnimationFrameSetTimeout() {
                    callback(currTime + timeToCall);
                }, timeToCall);

            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function cancelAnimationFrame(id) {
            clearTimeout(id);
        };
    }
}());


(function (undefined) {

    var baw = window.baw = window.baw || {};

    /**
     *  Fisher-Yates shuffle
     * shuffles list in-place
     * http://dtm.livejournal.com/38725.html
     * @param list
     */
    baw.shuffle = function shuffle(list) {
        var i, j, t;
        for (i = 1; i < list.length; i++) {
            j = Math.floor(Math.random()*(1+i));  // choose j in [0..i]
            if (j != i) {
                t = list[i];                        // swap list[i] and list[j]
                list[i] = list[j];
                list[j] = t;
            }
        }

//        var length = list.length;
//
//        var olds = angular.copy(list);
//
//        for (var i = 0; i < length; i++) {
//            var randomIndex = Math.floor(Math.random()  * (olds.length));
//            list[i] = olds.splice(randomIndex, 1)[0];
//        }
    };

    /**
     * Chainable if statement
     * @param test - the test that is evaluated
     * @param {Function} truthyAction - the function to run if the test is truthy
     * @param {Function} falseyAction - the function to run if the test id falsey
     * @returns {Object} returns 'this'
     */
    baw.fluidIf = function fluidIf(test, truthyAction, falseyAction) {
        if (test) {
            return truthyAction.call(this) || this;
        }

        if (falseyAction) {
            return falseyAction.call(this) || this;
        }

        return this;
    };

    baw.toType = function toType(obj) {
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
    };

    function stringPad(number, paddingDigits, paddingCharacter) {
        var padLoop = Math.floor(number).toString().length;

        var output = number.toString();
        if (!paddingCharacter) {
            paddingCharacter = '0';
        }
        while (padLoop < paddingDigits) {
            padLoop++;
            output = paddingCharacter + output;
        }
        return output;
    }

    baw.stringPad = stringPad;

    /**
     * A custom formatter for TimeSpans - accepts seconds only
     * @param seconds - the number of seconds to convert
     * @returns {string}
     */
    baw.secondsToDurationFormat = function secondsToDurationFormat(seconds) {
        if (typeof seconds != 'number') {
            seconds = parseFloat(seconds);
        }

        if (isNaN(seconds)) {
            return seconds;
        }

        var negative = false;
        if (seconds < 0) {
            negative = true;
            seconds = Math.abs(seconds);
        }

        var totalMilliseconds = Math.round(seconds * 1000),
            totalSeconds = seconds,
            totalMinutes = seconds / 60,
            totalHours = totalMinutes / 60,
            totalDays = totalHours / 24,
            result = negative ? "-" : "";

        // default format [+/-d days] HH:mm:ss.fff
        var dayComponent = Math.floor(totalDays);
        if (dayComponent != 0) {
            result += dayComponent.toString() + ( dayComponent == 1 ? " day " : " days ");
        }

        result += stringPad(Math.floor(totalHours) % 24, 2) + ":";
        result += stringPad(Math.floor(totalMinutes) % 60, 2) + ":";
        result += stringPad(Math.floor(totalSeconds) % 60, 2) + ".";
        result += stringPad(totalMilliseconds % 1000, 3);

        return result;
    };

    /**
     * Is it a valid guid?
     * @type {RegExp}
     */
    baw.GUID_REGEXP = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;

    baw.popUpWindow = function popUpWindow(provider_url, width, height, callback) {
        var screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
            screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
            outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.body.clientWidth,
            outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.body.clientHeight - 22),
            left = parseInt(screenX + ((outerWidth - width) / 2), 10),
            top = parseInt(screenY + ((outerHeight - height) / 2.5), 10),
            features = ('width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);

        var returneddata = 0;
        var newWindow = window.open(provider_url, 'Login', features);
        newWindow.returneddata = returneddata;

        function callbackOnClose() {
            setTimeout(function () {
                if (newWindow.closed) {
                    callback(newWindow.returneddata);
                }
                else {
                    callbackOnClose();
                }
            }, 50);
        }


        if (callback) {
            callbackOnClose();
        }

        if (window.focus)
            newWindow.focus();

        return false;
    };

    baw.angularCopies = new (function Angular() {
        this.fixedEncodeURIComponent = function fixedEncodeURIComponent(str) {
            str = str || "";
            return encodeURIComponent(str)
                .replace(/!/g, '%21')
                .replace(/'/g, '%27')
                .replace(/\(/g, '%28')
                .replace(/\)/g, '%29')
                .replace(/\*/g, '%2A')
                .replace(/%20/g, '+');
        };
        this.toKeyValue = function toKeyValue(obj) {
            var parts = [];
            angular.forEach(obj, function (value, key) {
                parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
            });
            return parts.length ? parts.join('&') : '';
        };
        this.encodeUriQuery = function encodeUriQuery(val, pctEncodeSpaces) {
            val = val || "";
            return encodeURIComponent(val).
                replace(/%40/gi, '@').
                replace(/%3A/gi, ':').
                replace(/%24/g, '$').
                replace(/%2C/gi, ',').
                replace((pctEncodeSpaces ? null : /%20/g), '+');
        };

        this.isUndefined = function isUndefined(value) {
            return typeof value == 'undefined';
        }

    });

}());


///**
// * moment duration patch
// *
// */
//if (moment) {
//    // make a dummy instance so i can patch constructor
//    var dummy = moment.duration();
//
//    // basic implementation, enhance where necessary
//    dummy.prototype.format = function momentDurationFormat() {
//        var result = "";
//
//        // default format [+/-d days] HH:mm:ss.fff
//        var dayComponent = Math.floor(this.asDays());
//        if (dayComponent != 0) {
//            result += dayComponent.toString() + " days ";
//        }
//
//        result += stringPad(Math.floor(this.hours()), 2) + ":";
//        result += stringPad(Math.floor(this.minutes()), 2) + ":";
//        result += stringPad(this.seconds().toFixed(3), 2);
//
//        return result;
//    };
//}
//else {
//    throw "moment.js not found, cannot patch";
//}








