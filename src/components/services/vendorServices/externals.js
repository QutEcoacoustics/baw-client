angular
    .module("bawApp.vendorServices", [
        "bawApp.vendorServices.auto",
        //"bawApp.services.core.mySillyLibrary"


    ])
    .config(["humanize-durationProvider", "momentProvider",
        "$windowProvider", "d3Provider", "c3Provider",
        function (humanizeDurationProvider, momentProvider, $windowProvider, d3Provider, c3Provider) {

            // HACK: add real duration formatting onto moment object!
            var moment = momentProvider.configureVendorInstance();
            var hd = humanizeDurationProvider.configureVendorInstance();

            moment.duration.fn.humanizeDuration = function (parameters) {
                var ms = this.asMilliseconds();
                if (parameters && parameters.round) {
                    var rounding = Math.pow(10, Number(parameters.round));
                    if (angular.isNumber(rounding)) {
                        ms = Math.round(ms / rounding) * rounding;
                    }
                }

                return hd(ms, parameters);
            };

            // HACK: d3 is stubborn, forcibly remove it from window
            var window = $windowProvider.$get();
            if (window.d3) {
                delete window.d3;
            }
            else {
                if (!window.jasmine) {
                    console.warn("D3 not on window, hack not required");
                }
            }

            // also lodash (as of version 4)
            if (window._) {
                delete window._;
            }
            else {
                if (!window.jasmine) {
                    console.warn("_ not on window, hack not required");
                }
            }

            // augment d3
            var d3 = d3Provider.configureVendorInstance();
            const coordinatesRegex = /translate\((.*)\)/;

            /**
             * Gets or sets a translate transform for a SVG element
             * @param {Number[]} [position]
             * @returns {undefined|Number[]}
             */
            d3.selection.prototype.translate = function (position) {
                if (position) {
                    if (typeof position === "function") {
                        return this.attr("transform", function () {
                            var p = position.apply(this, arguments);

                            return "translate(" + p[0] + "," + p[1] + ")";
                        });
                    }
                    else {
                        return this.attr("transform", "translate(" + position[0] + "," + position[1] + ")");
                    }
                }
                else {
                    var result = [];
                    this.each(function () {
                        var match = coordinatesRegex.exec(d3.select(this).attr("transform"));
                        if (match) {
                            result.push(match[1].split(",").map(parseFloat));
                        }
                        else {
                            result.push(null);
                        }
                    });

                    return result;
                }
            };

            /**
             * Gets or sets a translate transform for a SVG element
             * @param {Number[]} [translate]
             * @param {Number[]} [scale]
             * @returns {this|{Number[],Number[]}}
             */
            d3.selection.prototype.translateAndScale = function (translate, scale) {

                if (arguments.length === 0) {
                    let node = this.node();
                    for (let svgTransform of node.transform.baseVal) {
                        // https://developer.mozilla.org/en/docs/Web/API/SVGTransform
                        if (svgTransform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                            translate = [svgTransform.matrix.e, svgTransform.matrix.f];
                        }
                        else if (svgTransform.type === SVGTransform.SVG_TRANSFORM_SCALE) {
                            scale = [svgTransform.matrix.a, svgTransform.matrix.d];
                        }
                    }

                    return {translate, scale};
                }

                return this.attr("transform", function () {
                    var p = translate;
                    if (typeof translate === "function") {
                        p = translate.apply(this, arguments);
                    }
                    p = p || [0, 0];

                    var s = scale;
                    if (typeof scale === "function") {
                        s = scale.apply(this, arguments);
                    }
                    s = s || [1, 1];

                    return `translate(${p[0]}, ${p[1]}) scale(${s[0]}, ${s[1]})`;
                });
            };

            d3.selection.prototype.clipPath = function (clipUrl) {
                var funcUriRegex = /url\(#(.*)\)/;
                if (arguments.length === 1) {
                    var match = funcUriRegex.exec(clipUrl),
                        newUrl = clipUrl;
                    if (match) {
                        // angular's HTML 5 mode breaks relative links for the clip-path attribute
                        // See: https://github.com/angular/angular.js/issues/8934
                        // This function take a normal clip url and absolutifies it so it will work.
                        // UPDATE: https://github.com/angular/angular.js/issues/8934#issuecomment-56568466
                        // Now removing base tag and deprecating support for IE9
                        //var absoluteUrl = window.location.href;
                        newUrl = "url(#" + match[1] + ")";
                    }
                    return this.attr("clip-path", newUrl);
                }
                else {
                    return this.attr("clip-path");
                }
            };

            // augment c3
            var c3 = c3Provider.configureVendorInstance();
            let originalC3Generate = c3.generate;
            c3.generate = function(...args) {
                window.d3 = d3;

                let result =  originalC3Generate.apply(c3.chart.internal, args);

                delete window.d3;
                return result;
            };
        }]);
