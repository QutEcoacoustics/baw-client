var bawGLs = angular.module('bawApp.annotationViewer.gridLines', ['bawApp.configuration']);

bawGLs.directive('gridLines',
    [   'conf.paths',
        function (paths) {

            var defaultAxis = {
                    show: false,
                    max: null,
                    min: null,
                    step: null,
                    numberOfLines: null,
                    offset: 0
                },
                defaultConfig = {
                    x: angular.copy(defaultAxis),
                    y: angular.copy(defaultAxis),
                    width: null,
                    height: null
                };

            function hideElements(container) {
                angular.forEach(container.children, function(child) {
                    child.style.display = 'none';
                });
            }

            function drawGridLines(container, elementSize, xOrY,  show, max, min, offset, step, numberOfLines) {
                if (!show) {
                    hideElements(container);
                    return;
                }

                if (!angular.isNumber(max) ||
                    !angular.isNumber(min) ||
                    !angular.isNumber(offset) ||
                    !angular.isNumber(elementSize)) {
                    hideElements(container);
                    return;
                }

                if (!step && !numberOfLines) {
                    throw "gridLines:drawGridLines: the step and numberOfLines properties can not be set simultaneously";
                }

                // retrieve number of child elements currently available
                var children = container.children,
                    length = children.length;

                var difference = max - min,
                    width = null;

                if (step && angular.isNumber(step) && step > 0) {
                    width = (difference / step) * elementsSize;
                    numberOfLines = math.floor(difference / step);
                }
                else if (numberOfLines && angular.isNumber(numberOfLines) && numberOfLines > 0) {
                    width = elementsSize / numberOfLines;
                }
                else {
                    throw "invalid";
                }

                // there are two gridLines drawn by every child
                var diffLines = numberOfLines - (length * 2);
                if (diffLines < 0) {
                    // too many lines - remove some children
                    for (var i = 0; i > diffLines; i--) {
                        container.removeChild(children[i]);
                    }
                }
                else if (diffLines > 0) {
                    for (var k = 0; k < diffLines; k++) {
                        var newDiv = document.createElement("div");
                        container.appendChild(newDiv);
                    }
                }

                // finally set style of child nodes
                if (diffLines !== 0) {
                    children = container.children;
                    length = children.length;
                }

                for (var j = 0; j < length; j++) {
                    var element = children[j];

                    // shift all values by offset
                    // we have a inverted y-axis so subtract offset instead
                    var top = (j * width) - offset;

                    if (xOrY === 'x') {
                        element.style.height = width + 'px';
                        element.style.top = top + 'px';
                    }
                    else if (xOrY === 'y') {
                        element.style.width = width + 'px';
                        element.style.left = top + 'px';
                    }

                    // ensure all children are visible
                    element.style.display = 'visible';
                }
            }

            return {
                scope: {
                    configuration: "=configuration"
                },
                restrict: 'E',
                templateUrl:  paths.site.files.gridLines,
                link: function linker(scope, $element, attributes, controller, transcludeFunction) {
                    var element = $element[0];

                    attributes.$observe("gridLines", function(interpolatedValue) {
                        console.debug("grisLines:observe: do something", interpolatedValue);
                    });

                    var xContainer = element.querySelector(".xLines");
                    var yContainer = element.querySelector(".yLines");

                    scope.configuration = angular.extend(defaultConfig, scope.configuration);

                    scope.$watch(function() {
                        return scope.configuration.x;
                    }, function (newValue, oldValue) {
                        if (!newValue) {
                            return;
                        }

                        drawGridLines(xContainer, newValue.width, 'x', newValue.show,
                            newValue.max, newValue.min, newValue.offset,
                            newValue.step, newValue.numberOfLines);
                    }, true);

                    scope.$watch(function() {
                        return scope.configuration.x;
                    }, function (newValue, oldValue) {
                        if (!newValue) {
                            return;
                        }

                        drawGridLines(yContainer, newValue.height,  'y', newValue.show,
                            newValue.max, newValue.min, newValue.offset,
                            newValue.step, newValue.numberOfLines);
                    }, true);
                }
            };
        }
    ]
);