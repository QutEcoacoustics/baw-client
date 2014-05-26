var bawGLs = angular.module('bawApp.annotationViewer.gridLines', ['bawApp.configuration']);

bawGLs.directive('gridLines',
    [   'conf.paths',
        function (paths) {

            var defaultAxis = {
                    showGrid: false,
                    showScale: false,
                    showTitle: false,
                    max: null,
                    min: null,
                    step: null,
                    numberOfLines: null,
                    labelFormatter: function(number) { return number;}
                },
                defaultConfig = {
                    x: angular.copy(defaultAxis),
                    y: angular.copy(defaultAxis)
                };

            defaultConfig.x.width = null;
            defaultConfig.x.title = "X Axis";
            defaultConfig.y.height = null;
            defaultConfig.y.title = "Y Axis";


            function calculateSteps(size, max, min, step, numberOfLines) {
                if (!angular.isNumber(max) || !angular.isNumber(min) || !angular.isNumber(step) || !angular.isNumber(size)) {
                    return;
                }

                if (step && numberOfLines) {
                    throw "gridLines:drawGridLines: the step and numberOfLines properties can not be set simultaneously";
                }

                var difference = max - min,
                    thickness = null;

                if (step && angular.isNumber(step) && step > 0) {
                    thickness = (step / difference) * size;
                    numberOfLines = Math.floor(difference / step);

                    // if the steps fit perfectly into the size, don't draw the last line (we don't draw lines on the edges)
                    // the actual calculation also includes an extra pixel of thickness
                    var fitsIn = size / thickness;
                    if ((fitsIn - Math.floor(fitsIn)) < (1 / thickness)) {
                        numberOfLines--;
                    }

                }
                else if (numberOfLines && angular.isNumber(numberOfLines) && numberOfLines > 0) {
                    // subtract one because numberofLines = divisions + 2
                    thickness = size / (numberOfLines + 1);
                }
                else {
                    throw "invalid";
                }

                var result = [];
                result.push({value: min, position: 0});
                for (var i = 1; i <= numberOfLines; i++) {
                    var offset = i * thickness;
                    result.push({
                        value: ((offset / size ) * difference) + min,
                        position: offset
                    });
                }
                result.push({value: max, position: size});

                // lastly tag return object with data - a bit hacky
                result.min = min;
                result.max = max;

                return result;
            }

            function diffElementsChildren(container, expectedNumber, newElementTagName) {
                var diffLines = expectedNumber - container.children.length;
                if (diffLines < 0) {
                    // too many elements - remove some children
                    for (var i = 0; i > diffLines; i--) {
                        // remove any child, they are all the same
                        container.removeChild(container.children[0]);
                    }
                }
                else if (diffLines > 0) {
                    // too few elements, add some
                    for (var k = 0; k < diffLines; k++) {
                        var newDiv = document.createElement(newElementTagName);
                        container.appendChild(newDiv);
                    }
                }
            }

            function render(container, xOrY, size, steps, innerText, skipEnds, formatter) {
                var start = skipEnds ? 1 : 0,
                    end = skipEnds ? steps.length - 1 : steps.length;

                var biggest = -Infinity;
                for (var j = start; j < end; j++) {
                    var element = container.children[j - start];

                    if (innerText) {
                        var label = formatter(steps[j].value, j, steps.min, steps.max)
                        element.innerText = label;
                        biggest = label.length > biggest ? label.length : biggest;
                    }

                    var position = steps[j].position;

                    if (xOrY === 'y') {
                        element.style.top = (size - position) + 'px';
                    }
                    else if (xOrY === 'x') {
                        element.style.left = position + 'px';
                    }
                }

                return biggest;
            }

            function drawLines(lineContainer, elementSize, xOrY, steps, formatter) {
                if (!steps) {
                    lineContainer.style.display = 'none';
                    return;
                }

                diffElementsChildren(lineContainer, steps.length - 2, "div");
                var biggest = render(lineContainer, xOrY, elementSize, steps, false, true, formatter);

                // ensure grid lines are visible
                lineContainer.style.display = '';
            }

            function drawScales(scaleContainer, elementSize, xOrY, steps, formatter, titleElement, showTitle) {
                if (!steps) {
                    scaleContainer.style.display = 'none';
                    titleElement.style.display = 'none';
                    return;
                }

                diffElementsChildren(scaleContainer, steps.length, "span");
                var biggest = render(scaleContainer, xOrY, elementSize, steps, true, false, formatter);

                if (showTitle) {
                    titleElement.style.display = '';
                    if (xOrY == "x") {
                        titleElement.style.bottom = "-" + biggest + "em";
                    }
                    else {
                        titleElement.style.left = "-" + biggest + "em";
                    }
                }
                else {
                    titleElement.style.display = 'none';
                }

                // ensure scales are visible
                scaleContainer.style.display = '';
            }

            return {
                scope: {
                    configuration: "=configuration"
                },
                restrict: 'E',
                templateUrl: paths.site.files.gridLines,
                link: function linker(scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];

                    attributes.$observe("gridLines", function (interpolatedValue) {
                        console.debug("grisLines:observe: do something", interpolatedValue);
                    });

                    var xLineContainer = element.querySelector(".xLines"),
                        xScaleContainer = element.querySelector(".xScale"),
                        xTitle = element.querySelector(".xTitle"),
                        yLineContainer = element.querySelector(".yLines"),
                        yScaleContainer = element.querySelector(".yScale"),
                        yTitle = element.querySelector(".yTitle");


                    scope.configuration = angular.extend(defaultConfig, scope.configuration);

                    scope.$watch(function () {
                        return scope.configuration.x;
                    }, function (newValue, oldValue) {
                        if (!newValue) {
                            return;
                        }

                        var steps;
                        if (newValue.showScale || newValue.showGrid) {
                            steps = calculateSteps(newValue.width, newValue.max, newValue.min,
                                newValue.step, newValue.numberOfLines);
                        }

                        drawLines(xLineContainer, newValue.width, 'x', newValue.showGrid ? steps : undefined);
                        drawScales(xScaleContainer, newValue.width, 'x', newValue.showScale ? steps : undefined, newValue.labelFormatter, xTitle, newValue.showTitle);
                    }, true);

                    scope.$watch(function () {
                        return scope.configuration.y;
                    }, function (newValue, oldValue) {
                        if (!newValue) {
                            return;
                        }

                        var steps;
                        if (newValue.showScale || newValue.showGrid) {
                            steps = calculateSteps(newValue.height, newValue.max, newValue.min,
                                newValue.step, newValue.numberOfLines);
                        }

                        drawLines(yLineContainer, newValue.height, 'y', newValue.showGrid ? steps : undefined);
                        drawScales(yScaleContainer, newValue.height, 'y', newValue.showScale ? steps : undefined, newValue.labelFormatter, yTitle, newValue.showTitle);
                    }, true);
                }
            };
        }
    ]
);