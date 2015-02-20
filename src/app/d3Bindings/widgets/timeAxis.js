angular
    .module("bawApp.d3.widgets.timeAxis", [])
    .service(
    "TimeAxis",
    [
        "d3",
        function(d3) {
            return function TimeAxis(targetGroup, _scale, _options) {
                // variables
                var that = this,
                    defaultOptions = {
                        tickSize: 6,
                        tickPadding: 8,
                        position: [0, 0],
                        isVisible: true
                    },
                    options = angular.extend(defaultOptions, options),
                    scale = _scale || d3.time.scale(),
                    axisG;

                // exports
                this.update = update;
                this.axis = null;

                // init
                this.axis = create();
                this.update();

                // functions
                function create() {
                    var axis = d3.svg.axis()
                        .scale(scale)
                        .orient("bottom")
                        // d3 should automatically work out the tick interval
                        //.ticks(d3.time.month, 1)
                        // TODO: provide a dynamic/multiscale set of time formats
                        //.tickFormat(d3.time.format("%y-%m"))
                        .tickSize(options.tickSize)
                        .tickPadding(options.tickPadding);

                    axisG = targetGroup.append("g")
                        .classed("x axis time", true)
                        .translate(options.position)
                        .call(axis);

                    setVisibility();

                    return axis;
                }

                function update(_scale, position, isVisible) {
                    if (_scale) {
                        scale = _scale;
                    }

                    if (position) {
                        options.position = position;
                        axisG.translate(position);
                    }

                    if (isVisible !== undefined) {
                        var changeVisibility = options.isVisible !== isVisible;
                        options.isVisible = isVisible;

                        if (changeVisibility) {
                            setVisibility();
                        }
                    }

                    that.axis.scale(scale);
                    axisG.call(that.axis);

                }

                function setVisibility() {
                    axisG.attr("visibility", options.isVisible ? "visible" : "hidden");
                }
            };
        }
    ]
);