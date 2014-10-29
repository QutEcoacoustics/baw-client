angular
    .module("bawApp.vendorServices", [
                "bawApp.vendorServices.auto"
                //"bawApp.services.core.mySillyLibrary"


            ])
    .config(["humanize-durationProvider", "momentProvider",
             function (humanizeDurationProvider, momentProvider) {

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
             }]);
