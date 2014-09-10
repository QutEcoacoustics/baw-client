/**
 * A d3 Timeline View directive
 * Created by Mark on 09/09/2014.
 * based on http://bl.ocks.org/bunkat/2338034
 */
angular.module("bawApp.d3.timelineView", ["bawApp.d3"])
    .directive("bawTimelineView", ["d3", "moment", function (d3, moment) {

        function Details(elementId, jsonResponse) {
            var that = this;
            that.elementId = elementId;

            that.lanes = [];
            that.items = [];

            that.chart = null;
            that.main = null;
            that.mini = null;
            that.itemRects = null;
            that.brush = null;

            // build data structure
            angular.forEach(jsonResponse.data, function (value, key) {
                // ensure siteId is in lanes
                if (that.lanes.indexOf(value.siteId) == -1) {
                    that.lanes.push(value.siteId);
                }

                // create item entry
                that.items.push({
                    "lane": that.lanes.indexOf(value.siteId),
                    "id": value.id,
                    "start": moment(value.recordedDate).unix(),
                    "end": moment(value.recordedDate).add('seconds', value.durationSeconds).unix()
                });
            });

            // get max and min
            that.timeBegin = that.items[0].start;
            that.timeEnd = that.items[0].end;

            // get largest and smallest difference
            that.diffMin = that.items[0].end - that.items[0].start;
            that.diffMax = that.items[0].end - that.items[0].start;

            angular.forEach(that.items, function (value, key) {
                that.timeBegin = Math.min(that.timeBegin, value.start);
                that.timeEnd = Math.max(that.timeEnd, value.end);

                that.diffMin = Math.min(that.diffMin, value.end - value.start);
                that.diffMax = Math.max(that.diffMax, value.end - value.start);
            });

            that.laneLength = function laneLength() {
                return that.lanes.length;
            };

            var m = [20, 15, 15, 120], //top right bottom left
                w = 960 - m[1] - m[3],
                h = 500 - m[0] - m[2],
                miniHeight = that.laneLength() * 12 + 50,
                mainHeight = h - miniHeight - 50;

            //scales
            // start and end values must be in same range as the difference between start and end values.
            var preNormalise = d3.scale.linear()
                .domain([that.timeBegin, that.timeEnd])
                .range([that.diffMin, that.diffMax]);
            var x = d3.scale.linear()
                .domain([that.diffMin, that.diffMax])
                .range([0, w]);
            var x1 = d3.scale.linear()
                .range([0, w]);
            var y1 = d3.scale.linear()
                .domain([0, that.laneLength()])
                .range([0, mainHeight]);
            var y2 = d3.scale.linear()
                .domain([0, that.laneLength()])
                .range([0, miniHeight]);

            that.createChart = function createChart() {
                var chart = d3.select("#" + that.elementId)
                    .append("svg")
                    .attr("width", w + m[1] + m[3])
                    .attr("height", h + m[0] + m[2])
                    .attr("class", "chart");

                chart.append("defs").append("clipPath")
                    .attr("id", "clip")
                    .append("rect")
                    .attr("width", w)
                    .attr("height", mainHeight);

                return chart;
            };

            that.createMain = function createMain(chart) {
                that
                var main = chart.append("g")
                    .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
                    .attr("width", w)
                    .attr("height", mainHeight)
                    .attr("class", "main");

                //main lanes and texts
                main.append("g").selectAll(".laneLines")
                    .data(that.items)
                    .enter().append("line")
                    .attr("x1", m[1])
                    .attr("y1", function (d) {
                        return y1(d.lane);
                    })
                    .attr("x2", w)
                    .attr("y2", function (d) {
                        return y1(d.lane);
                    })
                    .attr("stroke", "lightgray");

                main.append("g").selectAll(".laneText")
                    .data(that.lanes)
                    .enter().append("text")
                    .text(function (d) {
                        return d;
                    })
                    .attr("x", -m[1])
                    .attr("y", function (d, i) {
                        return y1(i + 0.5);
                    })
                    .attr("dy", ".5ex")
                    .attr("text-anchor", "end")
                    .attr("class", "laneText");

                return main;
            };

            that.createMini = function createMini(chart) {
                var mini = chart.append("g")
                    .attr("transform", "translate(" + m[3] + "," + (mainHeight + m[0]) + ")")
                    .attr("width", w)
                    .attr("height", miniHeight)
                    .attr("class", "mini");

                //mini lanes and texts
                mini.append("g").selectAll(".laneLines")
                    .data(that.items)
                    .enter().append("line")
                    .attr("x1", m[1])
                    .attr("y1", function (d) {
                        return y2(d.lane);
                    })
                    .attr("x2", w)
                    .attr("y2", function (d) {
                        return y2(d.lane);
                    })
                    .attr("stroke", "lightgray");

                mini.append("g").selectAll(".laneText")
                    .data(that.lanes)
                    .enter().append("text")
                    .text(function (d) {
                        return d;
                    })
                    .attr("x", -m[1])
                    .attr("y", function (d, i) {
                        return y2(i + 0.5);
                    })
                    .attr("dy", ".5ex")
                    .attr("text-anchor", "end")
                    .attr("class", "laneText");

                return mini;
            };

            that.createItemRects = function createItemRects(main, mini) {
                var itemRects = main.append("g")
                    .attr("clip-path", "url(#clip)");

                //mini item rects
                mini.append("g").selectAll("miniItems")
                    .data(that.items)
                    .enter().append("rect")
                    .attr("class", function (d) {
                        return "miniItem" + d.lane;
                    })
                    .attr("x", function (d) {
                        return x(preNormalise(d.start));
                    })
                    .attr("y", function (d) {
                        return y2(d.lane + 0.5) - 5;
                    })
                    .attr("width", function (d) {
                        return x(d.end - d.start);
                    })
                    .attr("height", 10);

                //mini labels
                mini.append("g").selectAll(".miniLabels")
                    .data(that.items)
                    .enter().append("text")
                    .text(function (d) {
                        return d.id;
                    })
                    .attr("x", function (d) {
                        return x(preNormalise(d.start));
                    })
                    .attr("y", function (d) {
                        return y2(d.lane + 0.5);
                    })
                    .attr("dy", ".5ex");

                //brush
                that.brush = d3.svg.brush()
                    .x(x)
                    .on("brush", that.display);

                mini.append("g")
                    .attr("class", "x brush")
                    .call(that.brush)
                    .selectAll("rect")
                    .attr("y", 1)
                    .attr("height", miniHeight - 1);

                return itemRects;
            };

            that.display = function display() {
                var rects, labels,
                    minExtent = that.brush.extent()[0],
                    maxExtent = that.brush.extent()[1],
                    visItems = that.items.filter(function (d) {
                        return preNormalise(d.start) < maxExtent && preNormalise(d.end) > minExtent;
                    });

                that.mini.select(".brush")
                    .call(that.brush.extent([minExtent, maxExtent]));

                x1.domain([minExtent, maxExtent]);

                //update main item rects
                rects = that.itemRects.selectAll("rect")
                    .data(visItems, function (d) {
                        return d.id;
                    })
                    .attr("x", function (d) {
                        return x1(preNormalise(d.start));
                    })
                    .attr("width", function (d) {
                        return x1(preNormalise(d.end)) - x1(preNormalise(d.start));
                    });

                rects.enter().append("rect")
                    .attr("class", function (d) {
                        return "miniItem" + d.lane;
                    })
                    .attr("x", function (d) {
                        return x1(preNormalise(d.start));
                    })
                    .attr("y", function (d) {
                        return y1(d.lane) + 10;
                    })
                    .attr("width", function (d) {
                        return x1(preNormalise(d.end)) - x1(preNormalise(d.start));
                    })
                    .attr("height", function (d) {
                        return 0.8 * y1(1);
                    });

                rects.exit().remove();

                //update the item labels
                labels = that.itemRects.selectAll("text")
                    .data(visItems, function (d) {
                        return d.id;
                    })
                    .attr("x", function (d) {
                        return x1(Math.max(preNormalise(d.start), minExtent) + 2);
                    });

                labels.enter().append("text")
                    .text(function (d) {
                        return d.id;
                    })
                    .attr("x", function (d) {
                        return x1(Math.max(preNormalise(d.start), minExtent));
                    })
                    .attr("y", function (d) {
                        return y1(d.lane + 0.5);
                    })
                    .attr("text-anchor", "start");

                labels.exit().remove();
            };

            that.create = function update() {
                that.chart = that.createChart();
                that.main = that.createMain(that.chart);
                that.mini = that.createMini(that.chart);
                that.itemRects = that.createItemRects(that.main, that.mini);
            };

            that.create();
            that.display();
        }

        return {
            restrict: "EA",
            scope: {
                data: "="
            },
            templateUrl: "d3Bindings/timelineView/timelineViewTemplate.tpl.html",
            link: function ($scope, $element, attributes, controller, transcludeFunction) {

                // use this function to bind DOM events to angular scope
                // or d3 events to angular scope.
                // you can use the jQuery / d3 objects here (use the injected d3 instance)

                // where possible avoid jQuery
                var element = $element[0];

                // watch for changes on scope data
                $scope.$watch(
                    function () {
                        return $scope.data;
                    },
                    function (newValue, oldValue) {
                        if (newValue) {
                            $scope.details = new Details('audioRecordingTimelineContainer', newValue);
                        }
                    });

            },
            controller: "bawTimelineViewController"
        };
    }])
    .controller("bawTimelineViewController", ["$scope", "$element", "$attrs",
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