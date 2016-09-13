/**
 * A d3 Dot View directive
 * Created by Mark on 10/09/2014.
 * Based on http://neuralengr.com/asifr/journals/journals_dbs.html
 */
angular.module("bawApp.d3.dotView", ["bawApp.vendorServices.auto"])
    .directive("bawDotView", ["d3", "moment", function (d3, moment) {

        function DotViewDetails(elementId, jsonResponse) {
            var that = this;
            that.elementId = elementId;

            that.items = [];

            // build data structure
            angular.forEach(jsonResponse, function (value, key) {
                // {"hoursOfDay": [[0,3],[1, 2], [2,6], [5, 1], ... [23, 1]], "year": 2012}

                // get start and end in +10 timezone
                var start = moment(value.recordedDate).zone("+10:00");
                var end = moment(value.recordedDate).add(value.durationSeconds, "seconds").zone("+10:00");

                var startYear = start.year();
                var startHour = start.hour();
                var endHour = end.hour();

                var minHour = Math.min(startHour, endHour);
                var maxHour = Math.max(startHour, endHour);
                var found;
                for (var i = minHour; i <= maxHour; i++) {
                    var hour = i;
                    var foundYear = false;
                    for (var j = 0; j < that.items.length; j++) {
                        let valueItem = that.items[j];
                        if (valueItem.year === startYear) {
                            foundYear = true;
                            var foundHour = false;
                            /* jshint loopfunc:true */
                            angular.forEach(valueItem.hoursOfDay, (valueHours, keyHours) => {
                                var existingHour = valueHours[0];
                                if (hour === existingHour) {
                                    foundHour = true;
                                    // increment audioRecordingCount
                                    found = true;
                                    valueHours[1] += 1;
                                }
                            });

                            if (!foundHour) {
                                // add hour and count if it does not exist
                                valueItem.hoursOfDay.push([hour, 1]);
                            }
                        }
                    }

                    if (!foundYear) {
                        that.items.push({"year": startYear, "hoursOfDay": [
                            [hour, 1]
                        ]});
                    }
                }
            });

            that.truncate = function truncate(str, maxLength, suffix) {
                if (str.length > maxLength) {
                    str = str.substring(0, maxLength + 1);
                    str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
                    str = str + suffix;
                }
                return str;
            };

            that.mouseover = function mouseover(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll("circle").style("display", "none");
                d3.select(g).selectAll("text.value").style("display", "block");
            };

            that.mouseout = function mouseout(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll("circle").style("display", "block");
                d3.select(g).selectAll("text.value").style("display", "none");
            };

            var margin = {top: 20, right: 200, bottom: 0, left: 20},
                width = 800,
                height = 650;

            var firstHour = 0,
                lastHour = 23;

            var c = d3.scale.category20c();

            var x = d3.scale.linear()
                .range([0, width]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("top");

            var formatYears = d3.format("00");
            xAxis.tickFormat(formatYears);

            that.createView = function createView(data) {
                var svg = d3.select("#audioRecordingDots").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .style("margin-left", margin.left + "px")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                x.domain([firstHour, lastHour]);
                var xScale = d3.scale.linear()
                    .domain([firstHour, lastHour])
                    .range([0, width]);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + 0 + ")")
                    .call(xAxis);

                function getFill(d) {
                    return c(dataIndex);
                }

                function getX(d, i) {
                    return xScale(d[0]);
                }

                function getRadius(d) {
                    return rScale(d[1]);
                }

                for (var j = 0; j < data.length; j++) {
                    var dataIndex = j;
                    var g = svg.append("g").attr("class", "journal");

                    var circles = g.selectAll("circle")
                        .data(data[j].hoursOfDay)
                        .enter()
                        .append("circle");

                    var text = g.selectAll("text")
                        .data(data[j].hoursOfDay)
                        .enter()
                        .append("text");

                    var rScale = d3.scale.linear()
                        .domain([0, d3.max(data[j].hoursOfDay, function (d) {
                            return d[1];
                        })])
                        .range([2, 9]);

                    circles
                        .attr("cx", getX)
                        .attr("cy", j * 20 + 20)
                        .attr("r", getRadius)
                        .style("fill", getFill);

                    /* jshint loopfunc:true */
                    text
                        .attr("y", j * 20 + 25)
                        .attr("x", (d, i) =>  xScale(d[0]) - 5)
                        .attr("class", "value")
                        .text(function (d) {
                            return d[1];
                        })
                        .style("fill", (d) => c(dataIndex))
                        .style("display", "none");

                    /* jshint loopfunc:true */
                    g.append("text")
                        .attr("y", j * 20 + 25)
                        .attr("x", width + 20)
                        .attr("class", "label")
                        .text(that.truncate(data[j].year, 30, "..."))
                        .style("fill",  (d) => c(dataIndex))
                        .on("mouseover", that.mouseover)
                        .on("mouseout", that.mouseout);
                }
            };

            that.createView(that.items);
        }

        return {
            restrict: "EA",
            scope: {
                data: "="
            },
            templateUrl: "d3Bindings/dotView/dotView.tpl.html",
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
                        $scope.details = new DotViewDetails("audioRecordingDots", newValue);
                    }
                });

            },
            controller: "bawDotViewController"
        };
    }])
    .controller("bawDotViewController", ["$scope", "$element", "$attrs",
        function ($scope, $element, $attrs) {
            // The controller should host functionality native to angular
            // e.g.
            // - functions for button clicks
            // - API calls (not relevant in this case)
            // - scope modification
            // - iteraction with other services/providers
            // IT SHOULD NOT contain any reference to the d3 or jQuery objects

            //$scope.example = "Hello world!";

        }]);