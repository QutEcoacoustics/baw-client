var bawssc = bawssc || angular.module("bawApp.services.core", []);

bawssc.provider("moment", function() {

    // TODO: is there a better way to load moment without requiring it be attached to window?
    var moment = window.moment;

    // HACK: add real duration formatting onto moment object!
    var humanizeDuration = window.humanizeDuration;
    this.$get = [function momentFactory() {
        moment.humanizeDuration = humanizeDuration;

        moment.duration.fn.humanizeDuration = function(parameters) {
            return humanizeDuration(this.asMilliseconds(), parameters);
        };

        return moment;
    }];
});