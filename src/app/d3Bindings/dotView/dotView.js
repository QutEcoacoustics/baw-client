/**
 * A d3 Dot View directive
 * Created by Mark on 10/09/2014.
 * Based on http://neuralengr.com/asifr/journals/journals_dbs.html
 */
angular.module("bawApp.d3.dotView", ["bawApp.d3"])
    .directive("bawDotView", ["d3", "moment", function (d3, moment) {

        var dataStore = [];

        // d3 functions
        function truncate(str, maxLength, suffix) {
            if(str.length > maxLength) {
                str = str.substring(0, maxLength + 1);
                str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
                str = str + suffix;
            }
            return str;
        }

        var margin = {top: 20, right: 200, bottom: 0, left: 20},
            width = 800,
            height = 650;

        var start_year = 1970,
            end_year = 2013;

        var c = d3.scale.category20c();

        var x = d3.scale.linear()
            .range([0, width]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top");

        var formatYears = d3.format("0000");
        xAxis.tickFormat(formatYears);

        var create = function create(data) {
            var svg = d3.select("#audioRecordingDots").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .style("margin-left", margin.left + "px")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain([start_year, end_year]);
            var xScale = d3.scale.linear()
                .domain([start_year, end_year])
                .range([0, width]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + 0 + ")")
                .call(xAxis);

            for (var j = 0; j < data.length; j++) {
                var g = svg.append("g").attr("class","journal");

                var circles = g.selectAll("circle")
                    .data(data[j]['articles'])
                    .enter()
                    .append("circle");

                var text = g.selectAll("text")
                    .data(data[j]['articles'])
                    .enter()
                    .append("text");

                var rScale = d3.scale.linear()
                    .domain([0, d3.max(data[j]['articles'], function(d) { return d[1]; })])
                    .range([2, 9]);

                circles
                    .attr("cx", function(d, i) { return xScale(d[0]); })
                    .attr("cy", j*20+20)
                    .attr("r", function(d) { return rScale(d[1]); })
                    .style("fill", function(d) { return c(j); });

                text
                    .attr("y", j*20+25)
                    .attr("x",function(d, i) { return xScale(d[0])-5; })
                    .attr("class","value")
                    .text(function(d){ return d[1]; })
                    .style("fill", function(d) { return c(j); })
                    .style("display","none");

                g.append("text")
                    .attr("y", j*20+25)
                    .attr("x",width+20)
                    .attr("class","label")
                    .text(truncate(data[j]['name'],30,"..."))
                    .style("fill", function(d) { return c(j); })
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout);
            }

            function mouseover(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll("circle").style("display","none");
                d3.select(g).selectAll("text.value").style("display","block");
            }

            function mouseout(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll("circle").style("display","block");
                d3.select(g).selectAll("text.value").style("display","none");
            }
        };



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
                var element = $element[0];

                // watch for changes on scope data
                $scope.$watch(function () {
                    return $scope.data;
                }, function (newValue, oldValue) {
                    if (newValue) {
                        //updateCatalogueData(newValue.data);
                        create(dataStore);
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