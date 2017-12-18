angular
    .module("url", [])
    .provider(
    "$url",
    function () {
        var _renamerFunc = function(key) {return key;};

        function fixedEncodeURIComponent(str) {
            str = str || "";
            return encodeURIComponent(str)
                .replace(/!/g, "%21")
                .replace(/'/g, "%27")
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29")
                .replace(/\*/g, "%2A")
                .replace(/%20/g, "+");
        }

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
            if (angular.isUndefined(val) || val === null) {
                return "";
            }

            return encodeURIComponent(val).
            replace(/%40/gi, "@").
            replace(/%3A/gi, ":").
            replace(/%24/g, "$").
            replace(/%2C/gi, ",").
            replace(/%3B/gi, ";").
            replace(/%20/g, (pctEncodeSpaces ? "%20" : "+"));
        }
        

        function toKeyValue(obj, validateKeys, _tokenRenamer) {
            var tokenRenamer = _tokenRenamer || _renamerFunc;
            var parts = [];
            angular.forEach(obj, function(value, key) {
                if (validateKeys) {
                    // only add key value pair if value is not undefined, not null, and is not an empty string
                    var valueIsEmptyString = value === "";
                    if (value === undefined || value === null || valueIsEmptyString || value === false) {
                        return;
                    }
                }

                // apply casing transforms
                key = tokenRenamer(key);

                // Angular encodes `true` as just the key without a value - like a flag
                if (angular.isArray(value)) {
                    angular.forEach(value, function(arrayValue) {
                        parts.push(encodeUriQuery(key, true) +
                            (arrayValue === true ? "" : "=" + encodeUriQuery(arrayValue, true)));
                    });
                } else {
                    parts.push(encodeUriQuery(key, true) +
                        (value === true ? "" : "=" + encodeUriQuery(value, true)));
                }
            });
            return parts.length ? parts.join("&") : "";
        }

        /**
         * Tries to decode the URI component without throwing an exception.
         *
         * @private
         * @param str value potential URI component to check.
         * @returns {boolean} True if `value` can be decoded
         * with the decodeURIComponent function.
         */
        function tryDecodeURIComponent(value) {
            try {
                return decodeURIComponent(value);
            } catch (e) {
                // Ignore any invalid uri component
            }
        }


        /**
         * Parses an escaped url query string into key-value pairs.
         * Lifted from https://github.com/angular/angular.js/blob/0ece2d5e0b34a27baa6238c3c2dcb4f92ccfa805/src/Angular.js#L1289
         * @returns {Object.<string,boolean|Array>}
         */
        function parseKeyValue(/**string*/keyValue) {
            var obj = {};
            angular.forEach((keyValue || "").split("&"), function(keyValue) {
                var splitPoint, key, val;
                if (keyValue) {
                    key = keyValue = keyValue.replace(/\+/g, "%20");
                    splitPoint = keyValue.indexOf("=");
                    if (splitPoint !== -1) {
                        key = keyValue.substring(0, splitPoint);
                        val = keyValue.substring(splitPoint + 1);
                    }
                    key = tryDecodeURIComponent(key);
                    if (angular.isDefined(key)) {
                        val = angular.isDefined(val) ? tryDecodeURIComponent(val) : true;
                        if (!hasOwnProperty.call(obj, key)) {
                            obj[key] = val;
                        } else if (angular.isArray(obj[key])) {
                            obj[key].push(val);
                        } else {
                            obj[key] = [obj[key], val];
                        }
                    }
                }
            });
            return obj;
        }

        function formatUri(uri, values, tokenRenamer) {

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

                var query = toKeyValue(unused, true, tokenRenamer);

                if (query.length > 0) {
                    var qtnMarkPosition = formatted.indexOf("?");
                    if (qtnMarkPosition === -1) {
                        formatted += "?";
                    }
                    else {
                        formatted += "&";
                    }
                    formatted += query;
                }

                return formatted;
            }
        }

        function formatUriFast(urlFragments, ...urlValues) {
            let length = urlFragments.length;

            let url = "";
            for(let i = 0; i < length; i++) {
                url += urlFragments[i] + urlValues[i];
            }

            return url;
        }

        var exported = {
            fixedEncodeURIComponent,
            encodeUriQuery,
            toKeyValue,
            formatUri,
            formatUriFast,
            parseKeyValue
        };

        this.registerRenamer = function(suffix, renamerFunc) {
            if (renamerFunc) {
                var key = "formatUri" + suffix;
                exported[key] = function formatUri(uri, values) {
                    return exported.formatUri(uri, values, renamerFunc);
                };
            }
            else {
                throw new Error("Empty renamer function");
            }
        };

        this.$get = function() {
            return exported;
        };
    });