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
                        isVisible: true,
                        orient: "bottom",
                        customDateFormat: undefined
                    },
                    options = angular.extend(defaultOptions, _options),

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
                        .orient(options.orient)
                        .tickSize(options.tickSize)
                        .tickPadding(options.tickPadding);

                    if (options.customDateFormat) {
                        axis.tickFormat(d3.time.format.multi(options.customDateFormat));
                    }

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