angular
    .module("bawApp.d3.widgets.measureWidget", [])
    .service(
        "MeasureWidget",
        [
            "d3",
            function (d3) {
                class MeasureWidget {

                    constructor(targetGroup, options) {
                        // variables
                        var defaultOptions = {
                            tickSize: 4,
                            tickPadding: 3,
                            position: [0, 0],
                            isVisible: true,
                            timeFormat: d3.time.format("%y-%m"),
                            text: ["A", "A<->B", "B"],
                            width: 100,
                            height: 30
                        };

                        this._options = Object.assign(defaultOptions, options);

                        this._target = targetGroup;
                        this._xScale = d3.scale.linear().range([0, this._options.width]);


                        // init
                        this._create();
                        this.update();
                    }

                    // functions
                    _create() {
                        // pointA          length        pointB
                        //   |-----------------------------|

                        this._lineA = this._target.append("line").attr("class", "measure-line stem");
                        this._lineB = this._target.append("line").attr("class", "measure-line stem");
                        this._tickA = this._target.append("line").attr("class", "measure-line tick");
                        this._tickB = this._target.append("line").attr("class", "measure-line tick");

                        const dy = "";
                        this._labels = [
                            this._target.append("text").attr({
                                dy,
                                "text-anchor": "start",
                                "class": "measure-label point"
                            }),
                            this._target.append("text").attr({
                                dy,
                                "text-anchor": "middle",
                                "class": "measure-label length"
                            }),
                            this._target.append("text").attr({

                                dy,
                                "text-anchor": "end",
                                "class": "measure-label point"
                            })
                        ];

                        this._target.classed("measure-widget", true);
                    }

                    /**
                     * Do a full re-render
                     * @param options
                     */
                    update(options) {
                        if (options) {
                            Object.assign(this._options, options);
                            this._xScale.range([0, this._options.width]);
                        }

                        this._target.translate(this._options.position);
                        this._target.attr("visibility", this._options.isVisible ? "visible" : "hidden");

                        let height = this._options.height,
                            verticalPoint = height - this._options.tickSize;

                        this._lineA.attr({
                            x1: this._xScale(0.0),
                            x2: this._xScale(0.5),
                            y1: verticalPoint,
                            y2: verticalPoint
                        });
                        this._lineB.attr({
                            x1: this._xScale(0.5),
                            x2: this._xScale(1.0),
                            y1: verticalPoint,
                            y2: verticalPoint
                        });
                        this._tickA.attr({
                            x1: this._xScale(0.0),
                            x2: this._xScale(0.0),
                            y1: verticalPoint - this._options.tickSize,
                            y2: verticalPoint + this._options.tickSize
                        });
                        this._tickB.attr({
                            x1: this._xScale(1.0),
                            x2: this._xScale(1.0),
                            y1: verticalPoint - this._options.tickSize,
                            y2: verticalPoint + this._options.tickSize
                        });


                        this._labels.forEach((label, index, source) => {
                            let tickOffset = index === 0 || index === (source.length - 1) ?
                                this._options.tickSize : 0;
                            label.attr({
                                x: this._xScale(index / (source.length - 1)),
                                y: verticalPoint - (tickOffset + this._options.tickPadding)
                            });
                        });

                        this.updateLabelsText();
                    }

                    /**
                     * Only re-render the label's text
                     */
                    updateLabelsText(options) {
                        if (options) {
                            Object.assign(this._options, options);
                        }

                        this._labels.forEach((label, index) => {
                            label.text(this._options.text[index]);
                        });
                    }

                }

                return MeasureWidget;
            }
        ]
    );