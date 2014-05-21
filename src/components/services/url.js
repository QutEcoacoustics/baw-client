angular.module('url', ['ng']).

    service('$url', function () {

        var copy = angular.copy,
            equals = angular.equals,
            extend = angular.extend,
            forEach = angular.forEach,
            isDefined = angular.isDefined,
            isFunction = angular.isFunction,
            isString = angular.isString,
            jqLite = angular.element,
            noop = angular.noop,
            toJson = angular.toJson;

        function fixedEncodeURIComponent(str) {
            str = str || "";
            return encodeURIComponent(str)
                .replace(/!/g, '%21')
                .replace(/'/g, '%27')
                .replace(/\(/g, '%28')
                .replace(/\)/g, '%29')
                .replace(/\*/g, '%2A')
                .replace(/%20/g, '+');
        }
        this.fixedEncodeURIComponent = fixedEncodeURIComponent;

        /**
         * This method is intended for encoding *key* or *value* parts of query component. We need a custom
         * method because encodeURIComponent is too aggressive and encodes stuff that doesn't have to be
         * encoded per http://tools.ietf.org/html/rfc3986:
         *    query       = *( pchar / "/" / "?" )
         *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
         *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
         *    pct-encoded   = "%" HEXDIG HEXDIG
         *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
         *                     / "*" / "+" / "," / ";" / "="
         */
        function encodeUriQuery(val, pctEncodeSpaces) {
            if(angular.isUndefined(val) || val === null){
                return '';
            }
            return encodeURIComponent(val).
                replace(/%40/gi, '@').
                replace(/%3A/gi, ':').
                replace(/%24/g, '$').
                replace(/%2C/gi, ',').
                replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
        }
        this.encodeUriQuery = encodeUriQuery;

        function toKeyValue(obj, validateKeys) {
            var parts = [];
            angular.forEach(obj, function (value, key) {
                if (validateKeys) {
                    // only add key value pair if value is not undefined, not null, and is not an empty string
                    var valueIsEmptyString = angular.isString(value) && value.length < 1;
                    if (angular.isUndefined(value) || value == null || valueIsEmptyString || value === false) {
                        return;
                    }
                }

                var encodedKey = encodeUriQuery(key, /* encode spaces */ true);

                // Angular does this: if value is true, just include the key without a value
                var encodedValue = value === true ? '' : '=' + encodeUriQuery(value, /* encode spaces */ true);

                parts.push(encodedKey + encodedValue);
            });
            return parts.length ? parts.join('&') : '';
        }
        this.toKeyValue = toKeyValue;

            this.formatUri = function(uri, values) {

            // first format string
            var result = uri.formatReturnUnused(values),
                unused = result.unused,
                formatted = result.string;

            if (!unused || Object.keys(unused).length === 0) {
                return encodeURI(formatted);
            }
            else {
                // there's remaining key's, add them as a query string

                //if (formatted.slice(-1) === "/") {
                //    formatted = formatted.slice(0, 1);
                //}

                var query =  toKeyValue(unused, true);

                if  (formatted.indexOf("?") === -1 && query.length > 0) {
                    formatted += "?";
                }

                formatted += query;

                return formatted;
            }


        };



    });