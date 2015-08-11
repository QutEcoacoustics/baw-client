var ngDragabilly = angular.module("draggabilly", []);

/**
 * This is a basic implementation of dragging, intended ot be eventually replaced.
 *
 * It binds to the nice little http://draggabilly.desandro.com/ library.
 */
ngDragabilly.factory("Draggabilly", function () {

    if (window.Draggabilly) {

        // rewrite draggabilly so that co-ordiantes are persisted as transform


        return window.Draggabilly;
    }
    else {
        throw "The Draggabilly module requires the Draggabilly library to have been attached to window. It currently can not be found.";
    }
});

ngDragabilly.directive("draggie",
    ["Draggabilly",
        function (Draggabilly) {

            var defaultOptions = {
                axis: false,
                containment: false,
                grid: null,
                handle: null,
                enabled: true,
                raiseAngularEvents: false,
                useLeftTop: false,
                dragStart: angular.noop,
                dragMove: angular.noop,
                dragEnd: angular.noop
            };

            // TODO: make getStyleProperty a module
            var transformProperty = getStyleProperty("transform"); // jshint ignore:line

            return {
                restrict: "A",
                scope: {
                    options: "=dragOptions"
                },
                link: function (scope, $element, attributes/*, controller, transcludeFunction*/) {
                    var element = $element[0];

                    scope.options = angular.extend(defaultOptions, scope.options);

                    var draggie = new Draggabilly(element, scope.options);

                    draggie.on("dragStart", function (draggie, event, pointer) {
                        scope.options.dragStart(scope, draggie, event, pointer);

                        if (scope.options.raiseAngularEvents) {
                            scope.$emit("draggabilly:draggie:dragStart", scope, draggie, event, pointer);
                        }
                    });

                    draggie.on("dragMove", function (draggie, event, pointer) {
                        scope.options.dragMove(scope, draggie, event, pointer);

                        if (scope.options.raiseAngularEvents) {
                            scope.$emit("draggabilly:draggie:dragMove", scope, draggie, event, pointer);
                        }
                    });

                    var reposition = function useTransformPositioning(element, position) {
                        element.style.left = 0;
                        element.style.left = 0;
                        element.style[transformProperty] = "translate3d( " + position.x + "px, " + position.y + "px, 0)";
                    };

                    draggie.on("dragEnd", function (draggie, event, pointer) {
                        if (!scope.options.useLeftTop) {
                            reposition(draggie.element, draggie.position);
                        }


                        scope.options.dragEnd(scope, draggie, event, pointer);

                        if (scope.options.raiseAngularEvents) {
                            scope.$emit("draggabilly:draggie:dragEnd", scope, draggie, event, pointer);
                        }
                    });


                    var firstWatch = true;
                    scope.$watch(function () {
                        return scope.options.enabled;
                    }, function (newValue, oldValue) {
                        if (newValue === oldValue) {
                            return;
                        }

                        // don't enabled when enabled by default
                        if (firstWatch) {
                            firstWatch = false;
                            if (newValue) {
                                return;
                            }
                        }

                        if (newValue) {
                            draggie.enable();
                        }
                        else {
                            draggie.disable();
                        }
                    });
                }
            };
        }]);