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

        this.encodeUriQuery = function encodeUriQuery(val, pctEncodeSpaces) {
            val = val || "";
            return encodeURIComponent(val).
                replace(/%40/gi, '@').
                replace(/%3A/gi, ':').
                replace(/%24/g, '$').
                replace(/%2C/gi, ',').
                replace((pctEncodeSpaces ? null : /%20/g), '+');
        };



        this.toKeyValue = function toKeyValue(obj) {
            var parts = [];
            angular.forEach(obj, function (value, key) {
                parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
            });
            return parts.length ? parts.join('&') : '';
        };

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

                if  (formatted.indexOf("?") === -1) {
                    formatted += "?";
                }

                var query =  "";
                var first = true;
                for (var key in unused) {

                    if (!unused.hasOwnProperty(key)) {
                        continue;
                    }

                    query += (first ? "" : "&") + this.encodeUriQuery(key) + "=" + this.encodeUriQuery(unused[key]);

                    if (first) {
                        first = false;
                    }
                }

                formatted += query;

                return formatted;
            }


        };



    });