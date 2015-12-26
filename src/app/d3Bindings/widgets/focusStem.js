angular
    .module("bawApp.d3.widgets.focusStem", [])
    .service(
        "FocusStem",
        [
            "d3",
            function (d3) {
                class FocusStem {

                    constructor(targetGroup, options) {
                        // variables
                        var focusStemPathDefaults = {
                            width: 91,
                            stems: 4,
                            root: 8,
                            position: null,
                            text: function () {
                                return "default";
                            },
                            isVisible: true,
                            url: () => undefined
                        };

                        this._options = Object.assign(focusStemPathDefaults, options);

                        this._target = targetGroup;

                        // init
                        this._create();
                        this.update();
                    }

                    // functions
                    _create() {
                        this._textGroup = this._target.append("g")
                            .attr({
                                "text-anchor": "middle",
                                "class": "focus-text-group"
                            });

                        this._anchor = this._textGroup.append("a")
                            .attr({
                                "class": "focus-anchor",
                                "xlink:href": ""
                            })
                            .on("mousedown", function () {
                                d3.event.stopPropagation();
                            })
                            .on("click", function () {
                                d3.event.stopPropagation();
                            });
                        this._text = this._anchor.append("text")
                            .attr({
                                "dominant-baseline": "alphabetical",
                                "y": -(this._options.root),
                                "dy": (-0.2).toFixed(4) + "em"
                            })
                            .classed("focus-text", true)
                            .text(this._options.text);

                        // get text height one time
                        this._textHeight = this._text.node().getBBox().height;

                        this._path = this._textGroup.append("path")
                            .attr({
                                "class": "focus-stem-path"
                            });

                        this._target.classed("focus-stem", true);
                    }

                    /**
                     * Do a full re-render
                     * @param options
                     */
                    update(options) {
                        if (options) {
                            Object.assign(this._options, options);
                        }

                        this._target.translate(this._options.position || [0, 0]);
                        this._target.attr("visibility", this._options.isVisible ? "visible" : "hidden");


                        // update stem
                        let path = this._getFocusStemPath();
                        this._path.attr("d", path);

                        this.updateLabelsText();
                    }

                    /**
                     * Only re-render the label's text
                     */
                    updateLabelsText(options) {
                        if (options) {
                            Object.assign(this._options, options);
                        }

                        let url = this._options.url;
                        if (typeof url === "function") {
                            url = url();
                        }

                        this._text.text(this._options.text);
                        this._anchor.attr("xlink:href", url);
                        this._anchor.classed("disabled", !url);

                        // this IS MEGA bad for performance- forcing a layout
                        //focusStem.attr("d", getFocusStemPath(focusText.node().getComputedTextLength()));
                    }

                    _getFocusStemPath(width) {
                        let focusStemPath = this._options,
                            w = Math.round(width || focusStemPath.width) + focusStemPath.stems,
                            hw = w / 2.0,
                            s = focusStemPath.stems,
                            r = focusStemPath.root,
                            startY = -(focusStemPath.root + focusStemPath.stems);

                        return `m-${hw} ${startY} l0 ${s} l${w} 0 l0 -${s} m-${hw} ${s} l0 ${r}`;
                    }

                }

                return FocusStem;
            }
        ]
    );