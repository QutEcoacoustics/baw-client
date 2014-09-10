/**
 * A d3 Terrain View directive
 * Created by Mark on 10/09/2014.
 * Based on http://neuralengr.com/asifr/journals/journals_dbs.html
 */
angular.module("bawApp.d3.terrainView", ["bawApp.d3"])
    .directive("bawTerrainView", ["d3", "moment", function (d3, moment) {

        function TerrainViewDetails(elementId, jsonResponse) {
            var that = this;
            that.elementId = elementId;

            that.items = {};

            // build data structure
            angular.forEach(jsonResponse.data, function (value, key) {
                // minute resolution
                // {"datetime": "2014-09-10 15:00:00", "value": 5}

                // get start and end in +10 timezone
                var start = moment(value.recordedDate).zone('+10:00');
                var end = moment(value.recordedDate).add('seconds', value.durationSeconds).zone('+10:00');

                var momentFormatString = 'YYYY-MM-DD HH:00:00';

                // loop from start to end of recording, adding a minute each time.
                var diff = end.diff(start.clone().startOf('hour'), 'hours');
                for(var step = 0;step<=diff;step++){

                    var current = start.clone().startOf('hour').add('hour', step);
                    var currentFormatted = current.format(momentFormatString);
                    if(!that.items[currentFormatted]){
                        that.items[currentFormatted] = 1;
                    } else {
                        that.items[currentFormatted] += 1;
                    }
                }
            });

            var m = [79, 80, 160, 79],
                w = 1280 - m[1] - m[3],
                h = 800 - m[0] - m[2],
                parse = d3.time.format("%Y-%m-%d %H:%M:%S").parse,
                format = d3.time.format("%Y");

            // Scales. Note the inverted domain for the y-scale: bigger is up!
            that.x = d3.time.scale().range([0, w]);
            var y = d3.scale.linear().range([h, 0]),
                xAxis = d3.svg.axis().scale(that.x).orient("bottom").tickSize(-h, 0).tickPadding(6),
                yAxis = d3.svg.axis().scale(y).orient("right").tickSize(-w).tickPadding(6);

            that.createView = function createView(dataObject) {

                // Parse dates and numbers.
                var data = [];
                angular.forEach(dataObject, function (value, key) {
                    // d.datetime is already a Moment
                    data.push({
                        datetime:  parse(key),
                        value: +value
                    });
                });

                // An area generator.
                var area = d3.svg.area()
                    .interpolate("step-after")
                    .x(function (d) {
                        return that.x(d.datetime);
                    })
                    .y0(y(0))
                    .y1(function (d) {
                        return y(d.value);
                    });

                // A line generator.
                var line = d3.svg.line()
                    .interpolate("step-after")
                    .x(function (d) {
                        return that.x(d.datetime);
                    })
                    .y(function (d) {
                        return y(d.value);
                    });

                var svg = d3.select("#audioRecordingTerrain").append("svg:svg")
                    .attr("width", w + m[1] + m[3])
                    .attr("height", h + m[0] + m[2])
                    .append("svg:g")
                    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

                var gradient = svg.append("svg:defs").append("svg:linearGradient")
                    .attr("id", "gradient")
                    .attr("x2", "0%")
                    .attr("y2", "100%");

                gradient.append("svg:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#fff")
                    .attr("stop-opacity", .5);

                gradient.append("svg:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#999")
                    .attr("stop-opacity", 1);

                svg.append("svg:clipPath")
                    .attr("id", "clip")
                    .append("svg:rect")
                    .attr("x", that.x(0))
                    .attr("y", y(1))
                    .attr("width", that.x(1) - that.x(0))
                    .attr("height", y(0) - y(1));

                svg.append("svg:g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + w + ",0)");

                svg.append("svg:path")
                    .attr("class", "area")
                    .attr("clip-path", "url(#clip)")
                    .style("fill", "url(#gradient)");

                svg.append("svg:g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + h + ")");

                svg.append("svg:path")
                    .attr("class", "line")
                    .attr("clip-path", "url(#clip)");

                svg.append("svg:rect")
                    .attr("class", "pane")
                    .attr("width", w)
                    .attr("height", h)
                    .call(d3.behavior.zoom().on("zoom", zoom));

                function update(data) {

                    // Compute the maximum price.
                    that.x.domain([d3.max(data, function (d) {
                        return d.datetime;
                    }), d3.max(data, function (d) {
                        return d.datetime;
                    })]);
                    y.domain([0, d3.max(data, function (d) {
                        return d.value;
                    })]);

                    // Bind the data to our path elements.
                    svg.select("path.area").data([data]);
                    svg.select("path.line").data([data]);

                    draw();
                }

                function draw() {
                    svg.select("g.x.axis").call(xAxis);
                    svg.select("g.y.axis").call(yAxis);
                    svg.select("path.area").attr("d", area);
                    svg.select("path.line").attr("d", line);
                    d3.select("#footer span").text("U.S. Commercial Flights, " + that.x.domain().map(format).join("-"));
                }

                function zoom() {
                    d3.event.transform(x); // TODO d3.behavior.zoom should support extents
                    draw();
                }

                update(data);
            };

            that.createView(that.items);
        }


        return {
            restrict: "EA",
            scope: {
                data: "="
            },
            templateUrl: "d3Bindings/terrainView/terrainView.tpl.html",
            link: function ($scope, $element, attributes, controller, transcludeFunction) {

                // use this function to bind DOM events to angular scope
                // or d3 events to angular scope.
                // you can use the jQuery / d3 objects here (use the injected d3 instance)

                // where possible avoid jQuery
                var element = $element[0];

                // watch for changes on scope data
                $scope.$watch(function () {
                    return $scope.data;
                }, function (newValue, oldValue) {
                    if (newValue) {
                        //createView();
                        $scope.details = new TerrainViewDetails('audioRecordingTerrain', newValue);
                    }
                });

            },
            controller: "bawTerrainViewController"
        };
    }])
    .controller("bawTerrainViewController", ["$scope", "$element", "$attrs",
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