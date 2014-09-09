var bawssc = bawssc || angular.module("bawApp.services.core", []);

bawssc.provider("moment", function() {

    // TODO: is there a better way to load moment without requiring it be attached to window?
    var moment = window.moment;

    // HACK: add real duration formatting onto moment object!
    var humanizeDuration = window.humanizeDuration;
    this.$get = [function momentFactory() {
        moment.humanizeDuration = humanizeDuration;

        moment.duration.fn.humanizeDuration = function(parameters) {
            var ms = this.asMilliseconds();
            if (parameters && parameters.round) {
                var rounding = Math.pow(10, Number(parameters.round));
                if (angular.isNumber(rounding)) {
                    ms = Math.round(ms / rounding) * rounding;
                }
            }

            return humanizeDuration(ms, parameters);
        };

        return moment;
    }];
});