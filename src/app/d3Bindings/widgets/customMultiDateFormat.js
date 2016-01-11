angular
    .module("bawApp.d3.widgets.customMultiDateFormat", [])
    .constant(
        "customMultiDateFormat",
        () => [
            // https://github.com/mbostock/d3/wiki/Time-Formatting
            ["%S.%L", function (d) {
                return d.getMilliseconds();
            }],
            [":%S", function (d) {
                return d.getSeconds();
            }],
            ["%H:%M", function (d) {
                return d.getMinutes();
            }],
            ["%H:%M", function (d) {
                return d.getHours();
            }],
            ["%b-%d", function (d) {
                return d.getDay() && d.getDate() !== 1;
            }],
            ["%b-%d", function (d) {
                return d.getDate();
            }],
            ["%Y-%b", function (d) {
                return d.getMonth();
            }],
            ["%Y-%b", function () {
                return true;
            }]
        ]);