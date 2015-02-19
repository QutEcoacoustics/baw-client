angular
    .module("bawApp.vendorServices", [
        "bawApp.vendorServices.auto"
        //"bawApp.services.core.mySillyLibrary"


    ])
    .config(["humanize-durationProvider", "momentProvider",
        "$windowProvider", "d3Provider",
        function (humanizeDurationProvider, momentProvider, $windowProvider, d3Provider) {

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

            // augment d3
            var d3 = d3Provider.configureVendorInstance();
            d3.selection.prototype.translate = function (position) {
                var coordinatesRegex = /translate\((.*)\)/
                if (position) {
                    return this.attr("transform", "translate(" + position[0] + "," + position[1] + ")");
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

        }]);
