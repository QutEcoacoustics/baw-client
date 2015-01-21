angular
    .module("bawApp.d3.widgets.timeAxis", [])
    .service(
    "TimeAxis",
    [
        "d3",
        function(d3) {
            return function TimeAxis(targetGroup, _scale, options) {
                // variables
                var that = this,
                    defaultTickSize = 6,
                    defaultTickPadding = 8,
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
                        .tickSize(options.tickSize || defaultTickSize)
                        .tickPadding(options.tickPadding || defaultTickPadding);

                    axisG = targetGroup.append("g")
                        .classed("x axis time", true)
                        .translate([0, options.y])
                        .call(axis);

                    return axis;
                }

                function update(_scale, position) {
                    if (_scale) {
                        scale = _scale;
                    }

                    if (position) {
                        axisG.translate(position);
                    }

                    that.axis.scale(scale);
                    axisG.call(that.axis);
                }
            }
        }
    ]
);