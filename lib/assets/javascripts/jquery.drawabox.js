
(function ($) {

    var SELECTED_ATTRIBUTE = "data-selected";

    var clickLocation = function (e) {
        var posx = 0;
        var posy = 0;
        if (!e) e = window.event;
        if (!e) return { posx: 0, posy: 0 };
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }

        // FIX: need to take off an extra 10px from y (vertical) for some reason - don't know why.
        return { posx: posx - 5, posy: posy - 5 };
    };

    var elementPosition = function (obj) {
        var curleft = 0;
        var curtop = 0;
        if (obj && obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        return { posx: curleft, posy: curtop };
    };

    var setBoxBoxPosition = function ($box, startPos, currentPos) {
        if (startPos.x > currentPos.x) {
            $box.css('left', currentPos.x + 'px');
        } else {
            $box.css('left', startPos.x + 'px');
        }
        if (startPos.y > currentPos.y) {
            $box.css('top', currentPos.y + 'px');
        } else {
            $box.css('top', startPos.y + 'px');
        }
    };

    var maxChildrenCheck = function (max, $ele) {
        if (max) {
            var numKids = $ele.children().length;
            return (numKids >= max);
        } else {
            return false;
        }
    };

    var mousedown = function (e) {
        // only want to handle clicks on container, not on existing boxs
        if (e.target != this) {
            return;
        }

        e.preventDefault();

        var $thisMouseDown = $(this);
        var dataMouseDown = $thisMouseDown.data('drawboxes');

        // do not execute if no more boxs allowed
        if (dataMouseDown.maxChildrenReached) {
            // TODO: raise too-many-boxs event
            return;
        }


        // get postion of mouse click
        var docClickLocation = clickLocation(e);
        var containerOffset = $thisMouseDown.offset();

        var clickPos = {
            x: parseInt(docClickLocation.posx - containerOffset.left),
            y: parseInt(docClickLocation.posy - containerOffset.top)
        };

        // update stored values
        dataMouseDown.mousedown = true;
        dataMouseDown.mousedownPos = clickPos;
    };

    var mouseup = function (e) {

        var $thisMouseUp = $(this);
        var dataMouseUp = $thisMouseUp.data('drawboxes');

        var wasMouseDownSet = dataMouseUp.mousedown;
        var currentBoxId = dataMouseUp.currentMouseDragBoxId;

        // mousedown must be true
        if (!wasMouseDownSet) {
            return;
        }

        var $box = $('#' + currentBoxId);
        $box.draggable({ containment: 'parent' })
            .resizable({ containment: 'parent', handles: 'all' });

        // update stored values
        dataMouseUp.mousedown = false;
        dataMouseUp.currentMouseDragBoxId = "";

        // raise moved event
        dataMouseUp.options.boxResized($box);
    };
    var dataIdKey = 'data-id';

    function createBox($parent, contextData, width, height, top, left) {

        if (contextData === undefined) {
            throw "Context data must be given";
        }
        var closeIconTemplate = '<span class="close-icon"></span>';


        var uniqueId = Number.Unique();
        $('.boxItem').attr(SELECTED_ATTRIBUTE, false);
        var newId = "boxItem_" + uniqueId;
        contextData.currentMouseDragBoxId = newId;

        if (contextData.options.showOnly === true) {
            closeIconTemplate = "";
        }

        $parent.append('<div '+ SELECTED_ATTRIBUTE +'="true" id="' + newId + '" class="boxItem ui-widget" style="overflow:hidden;width:' + width + 'px;height:' + height + 'px;">' + closeIconTemplate + '</div>');

        var $newBox = $('#' + newId);
        $newBox.attr(dataIdKey, uniqueId);

        // add selection highlight
        $newBox.click(function () {

            $('.boxItem').attr(SELECTED_ATTRIBUTE, false);
            var $t = $(this);
            $t.attr(SELECTED_ATTRIBUTE, true);
            contextData.options.boxSelected($t);
        });

        if (contextData.options.showOnly !== true) {
            // add delete click handler
            $('#' + newId + ' span').click(function () {
                var $t = $(this).parent(),
                    $container = $t.parent();
                $t.remove();

                contextData.maxChildrenReached = maxChildrenCheck($container.data('drawboxes').options.maxBoxes, $container);

                contextData.options.boxDeleted($t);
            });
            // add other events
            $newBox.resizable({
                handles: "all",
                resize: function (event, ui) { contextData.options.boxResizing($newBox); },
                stop: function (event, ui) { contextData.options.boxResized($newBox); }
            });
            $newBox.draggable({
                drag: function (event, ui) { contextData.options.boxMoving($newBox); },
                stop: function (event, ui) { contextData.options.boxMoved($newBox); }
            });
        }

        if (left) {
            $newBox.css('left', left + 'px');
        }
        if (top) {
            $newBox.css('top', top + 'px');
        }

        contextData.maxChildrenReached = maxChildrenCheck(contextData.options.maxBoxes, $newBox);

        // raise new box event
        contextData.options.newBox($newBox);

        return $newBox;
    }

    var mousemove = function (e) {

        var $thisMouseMove = $(this);
        var dataMouseMove = $thisMouseMove.data('drawboxes');

        var wasMouseDownSet = dataMouseMove.mousedown;

        // mousedown must be true
        if (!wasMouseDownSet) {
            return;
        }

        //var wasMouseDownSet = dataMouseMove.mousedown;
        var currentBoxId = dataMouseMove.currentMouseDragBoxId;

        // get postion of mouse
        var docClickLocation = clickLocation(e);
        var containerOffset = $thisMouseMove.offset();
        var containerWidth = $thisMouseMove.width();
        var containerHeight = $thisMouseMove.height();

        var currentPos = {
            x: Math.min(parseInt(docClickLocation.posx - containerOffset.left), containerWidth),
            y: Math.min(parseInt(docClickLocation.posy - containerOffset.top), containerHeight)
        };

        var startClickPos = dataMouseMove.mousedownPos;

        // create new box or update box being dragged
        var xdiff = Math.abs(currentPos.x - startClickPos.x);
        var ydiff = Math.abs(currentPos.y - startClickPos.y);

        // this is wrong - it incorrectly gets hypotenuseal distance, not the length of the edges
        //var distance = Math.sqrt((xdiff * xdiff) + (ydiff * ydiff));
        var distance = Math.min(xdiff, ydiff);

        if (!currentBoxId) {

            // no box created yet. Only create box once dragged for 10 pixels
            if (distance > 10) {
                var $newBox = createBox($thisMouseMove, dataMouseMove, xdiff, ydiff);
                setBoxBoxPosition($newBox, startClickPos, currentPos);
            }
        } else {
            var $box = $('#' + currentBoxId);
            $box.width(xdiff);
            $box.height(ydiff);
            setBoxBoxPosition($box, startClickPos, currentPos);

            // raise moved event
            dataMouseMove.options.boxResizing($box);
        }
    };

    var removePx = function (cssValue) {
        if (!cssValue) {
            return 0;
        }
        var pos = cssValue.indexOf("px");
        if (pos == -1) {
            //throw new Error("Non pixel quantity given, cannot convert:" + cssValue);
            return NaN;
        } else {
            return parseInt(cssValue.substring(0, pos));
        }
    };
    var getBox = function ($element) {
        return {
            id: $element.attr(dataIdKey),
            left: removePx($element.css("left")),
            top: removePx($element.css("top")),
            width: removePx($element.css("width")) + 2,  // box model - border not included in widths
            height: removePx($element.css("height")) + 2 // box model - border not included in widths
        };
    };
    var remap = function (value) {
        var bevent = function (ele) {
            var b = getBox(ele);
            return value.apply(ele, [ele, b]);
        };

        return value ? bevent : (function () { });
    };


    var methods = {};
    methods.init = function (options) {

        if (options && !(options instanceof Object)) {
            throw new Error("If defined, eventMap should be an object");
        }

        if (!options) options = {};

        // Create some defaults, extending them with any options that were provided
        options = $.extend({
            maxBoxes: Infinity,
            initialBoxes: [],
            /// Should only should allow selection events to be raised
            showOnly: false
            //            'location': 'top',
            //            'background-color': 'blue'
        }, options);


        var maxBoxes = parseInt(options.maxBoxes);
        if (isNaN(maxBoxes) && maxBoxes < 1) {
            throw new Error("Max boxs must be an int greater than zero (or undefined)");
        }
        if (maxBoxes < options.initialBoxes.length) {
            throw "max boxes must be greater than the initial number of boxes that are to be drawn";
        }

        // note: technically callbacks not events
        // note: each function will be called with element of focus, and a bounds box (see remap func)
        var events = [
            "newBox", "boxSelected",
            "boxResizing", "boxResized", "boxMoving", "boxMoved", "boxDeleted"
        ];
        for (var i = 0; i < events.length; i++) {
            var eventName = events[i];
            options[eventName] = remap(options[eventName]);

            if (options.showOnly && i > 1) {
                console.warn("drawabox.init: The show only option has been enabled. The event handler you assigned to options." + eventName + " will never be called");
            }
        }


        return this.each(function () {

            var $this = $(this);
            var data = $this.data('drawboxes');

            if (!data) {
                // If the plugin hasn't been initialized yet
                // Do more setup stuff here

                $this.data('drawboxes', {
                    target: $this,
                    mousedown: false,
                    mousedownPos: { posx: 0, posy: 0 },
                    currentMouseDragBoxId: "",
                    maxChildrenReached: maxChildrenCheck(options.maxBoxs, $this),
                    options: options
                });

                if (options.showOnly !== true) {
                    $this.mousedown(mousedown);
                    $this.mouseup(mouseup);
                    $this.mousemove(mousemove);
                }

                if (options.initialBoxes.length > 0) {

                    for (var j = 0; j < options.initialBoxes.length; j++) {
                        var box = options.initialBoxes[j];

                        // create box!
                        createBox($this, $this.data(dataIdKey), box.width, box.height, box.top, box.left);
                    }
                }
            }

        });
    };
    methods.showOnly = function (options, suppliedBoxes) {
        options = $.extend(options, { showOnly: true, initialBoxes: suppliedBoxes });
        return methods.init(options);
    };
    methods.getBoxes = function () {

        return this.each(function () {

            // return all the boxs made by this plugin
            var $this = $(this),
                data = $this.data('drawboxes');

            var boxs = [];

            var kids = data.target.children();
            for (var i = 0; i < kids.length; i++) {
                var $kid = $(kids[i]);
                boxs[i] = getBox($kid);
            }

            return boxs;
        });
    };
    methods.destroy = function () {

        return this.each(function () {

            var $this = $(this),
                data = $this.data('drawboxes');

            // Namespacing FTW
            $(window).unbind('.drawabox');
            //data.tooltip.remove();
            $this.removeData('drawboxes');

        });

    };


    $.fn.drawabox = function (method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.drawabox');
        }

    };

})(jQuery);