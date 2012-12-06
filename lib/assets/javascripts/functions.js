
/**
 * String format function
 * http://www.isurinder.com/blog/post/2011/04/02/StringFormat-In-JavaScript.aspx#.UKWRyvgzpQs
 * @type {Function}
 */
String.format = String.prototype.format = function() {
    var i=0;
    var string = (typeof(this) == "function" && !(i++)) ? arguments[0] : this;

    for (; i < arguments.length; i++){
        string = string.replace(/\{\d+?\}/, arguments[i]);
    }

    return string;
};

/**
 * Generates a unique number for the page. Unique only for each refresh.
 * @return {*|number}
 * @constructor
 */
Number.Unique = function() {
    var i = Number.uniqueIncrementId || 0;
    i += 1;
    Number.uniqueIncrementId = i;
    return i;
};

/**
 * Chainable if statement
 * @param test - the test that is evaluated
 * @param {Function} truthyAction - the function to run if the test is truthy
 * @param {Function} falseyAction - the function to run if the test id falsey
 * @returns {Object} returns 'this'
 */
function fluidIf(test, truthyAction, falseyAction){
    if (test) {
        return truthyAction.call(this) || this;
    }

    if (falseyAction) {
        return falseyAction.call(this) || this;
    }

    return this;
}


/**
 * Is it a valid guid?
 * @type {RegExp}
 */
var GUID_REGEXP = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;


var newwindow;
function popUpWindow(provider_url, width, height) {
    var screenX     = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
        screenY     = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
        outerWidth  = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.body.clientWidth,
        outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.body.clientHeight - 22),
        left        = parseInt(screenX + ((outerWidth - width) / 2), 10),
        top         = parseInt(screenY + ((outerHeight - height) / 2.5), 10),
        features    = ('width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);

    newwindow = window.open(provider_url, 'Login', features);

    if (window.focus)
        newwindow.focus();

    return false;
}

var angularCopies = new (function Angular() {
    this.fixedEncodeURIComponent = function fixedEncodeURIComponent(str) {
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
        angular.forEach(obj, function(value, key) {
            parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
        });
        return parts.length ? parts.join('&') : '';
    };
    function encodeUriQuery(val, pctEncodeSpaces) {
        return encodeURIComponent(val).
            replace(/%40/gi, '@').
            replace(/%3A/gi, ':').
            replace(/%24/g, '$').
            replace(/%2C/gi, ',').
            replace((pctEncodeSpaces ? null : /%20/g), '+');
    }

});