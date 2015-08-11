/**
 * d3 Audio View directive
 * Created by Mark on 30/09/2014
 */
angular.module("bawApp.d3.audioView", ["bawApp.vendorServices.auto"])
    .directive("bawAudioView", ["d3", "moment", function (d3, moment) {

        // d3 functions
        // private properties - globals, formatters, magic numbers

        var keyYearFormat = d3.time.format("%Y"),
            keyMonthFormat = d3.time.format("%m");
        // parseFormat = d3.time.format("%Y-%m-%dT%H:%M:%S%Z")

        var updateData = function updateData(json) {
            // change data so it is nested properly
            var data = d3.nest()
                .key(function (d) { return keyYearFormat(new Date(d.recordedDate));})
                .key(function (d) { return keyMonthFormat(new Date(d.recordedDate));})
                .sortKeys(d3.descending)
                .entries(json);

            // add year divs
            var yearsData = d3
                .select("#audioRecordingDisplay")
                .selectAll("div.year")
                .data(data);

            yearsData
                .enter()
                .append("div")
                .text(function (d) {return d.key; })
                .attr("class", "year");

            yearsData.exit().remove();

            // add month divs
            var monthData = yearsData
                .selectAll("div")
                .data(function(year){ return year.values; });

            monthData
                .enter()
                .append("div")
                .text(function (d) {return d.key; })
                .attr("class", "month");

            // select the first available month so there is something to work with
            var selectedMonthData = [data[0]];

            // add selected year div
            var displayedYearData = d3
                .select("#audioRecordingDisplay")
                .selectAll("div.displayedYear")
                .data(selectedMonthData);

            displayedYearData
                .enter()
                .append("div")
                .text(function (d) {return d.key; })
                .attr("class", "day");



        };


        return {
            restrict: "EA",
            scope: {
                data: "="
            },
            templateUrl: "d3Bindings/audioView/audioView.tpl.html",
            link: function ($scope, $element, attributes, controller, transcludeFunction) {

                // use this function to bind DOM events to angular scope
                // or d3 events to angular scope.
                // you can use the jQuery / d3 objects here (use the injected d3 instance)

                // where possible avoid jQuery
                //var element = $element[0];

                // watch for changes on scope data
                $scope.$watch(function () {
                    return $scope.data;
                }, function (newValue, oldValue) {
                    if (newValue) {
                        updateData(newValue);
                    }
                });

            },
            controller: "bawAudioViewController"
        };
    }])
    .controller("bawAudioViewController", ["$scope", "$element", "$attrs",
        function ($scope, $element, $attrs) {
            // The controller should host functionality native to angular
            // e.g.
            // - functions for button clicks
            // - API calls (not relevant in this case)
            // - scope modification
            // - iteraction with other services/providers
            // IT SHOULD NOT contain any reference to the d3 or jQuery objects

        }]);