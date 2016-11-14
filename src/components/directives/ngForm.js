angular
    .module("bawApp.directives.ngForm", [])
    .directive("form", function() {
        // dirty hack until https://github.com/angular/angular.js/issues/14749 is a thing
        return {
            require: "form",
            link:  {
                // use pre-linking function so we can wrap methods before any controls are added
                pre: function(scope, elm, attrs, ctrl) {
                    if (ctrl.$getControls) {
                        throw new Error("Angular finally allowed $getControls on FormController");
                    }

                    var controls = [],
                        originalAdd = ctrl.$addControl,
                        originalRemove = ctrl.$removeControl;

                    ctrl.$addControl = function(control) {
                        //console.debug("Test controller extension", control);

                        controls.push(control);

                        originalAdd.call(ctrl, control);
                    };

                    ctrl.$removeControl = function(control) {
                        arrayRemove(controls, control);

                        originalRemove.call(ctrl, control);
                    };

                    ctrl.$getControls = function() {
                        return controls;
                    };

                    ctrl.$validateChildren = function () {
                        for (var control of controls) {
                            if (control) {
                                //console.debug("Validating: " + control.$name);
                                control.$validate();
                            }
                        }
                    };

                    function arrayRemove(array, value) {
                        var index = array.indexOf(value);
                        if (index >= 0) {
                            array.splice(index, 1);
                        }
                        return index;
                    }
                }
            }
        };
    });
