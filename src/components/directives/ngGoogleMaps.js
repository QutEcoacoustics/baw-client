/*
 * NOTE: this was copied from angular-ui. At some point this file should be deleted.
 */

/* globals google*/

var bawds = bawds || angular.module("bawApp.directives", ["bawApp.configuration", "bawApp.directives.ui.bootstrap"]);

/* Start map directives */
/** stolen from angular ui
 * https://github.com/angular-ui/angular-ui/commit/d77bfe74e4ca2c463f76bac4f8b2e1e7464f7773#modules/directives/map/map.js
 */
    //Setup map events from a google map object to trigger on a given element too,
    //then we just use ui-event to catch events from an element
function bindMapEvents(scope, eventsStr, googleObject, element) {
    angular.forEach(eventsStr.split(" "), function (eventName) {
        //Prefix all googlemap events with 'map-', so eg 'click'
        //for the googlemap doesn't interfere with a normal 'click' event

        var $event = {
            type: "map-" + eventName
        };
        google.maps.event.addListener(googleObject, eventName, function (evt) {
            element.triggerHandler(angular.extend({}, $event, evt));
            //We create an $apply if it isn't happening. we need better support for this
            //We don't want to use timeout because tons of these events fire at once,
            //and we only need one $apply
            if (!scope.$$phase) {
                scope.$apply();
            }
        });

        var $eventOnce = {
            type: "map-once-" + eventName
        };
        google.maps.event.addListenerOnce(googleObject, eventName, function (evt) {
            element.triggerHandler(angular.extend({}, $eventOnce, evt));
            console.log("addListenerOnce", $eventOnce);
            //We create an $apply if it isn't happening. we need better support for this
            //We don't want to use timeout because tons of these events fire at once,
            //and we only need one $apply
            if (!scope.$$phase) {
                scope.$apply();
            }
        });

    });
}

bawds.directive("bawMap", ["ui.config", "$parse", function (uiConfig, $parse) {

    var mapEvents = "bounds_changed center_changed click dblclick drag dragend " +
        "dragstart heading_changed idle maptypeid_changed mousemove mouseout " +
        "mouseover projection_changed resize rightclick tilesloaded tilt_changed " +
        "zoom_changed";
    var options = uiConfig.map || {};

    return {
        restrict: "A",
        //doesn't work as E for unknown reason
        link: function (scope, elm, attrs) {
            var opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));
            var map = new google.maps.Map(elm[0], opts);
            var model = $parse(attrs.bawMap);

            //Set scope variable for the map
            model.assign(scope, map);

            bindMapEvents(scope, mapEvents, map, elm);
        }
    };
}]);

bawds.directive("bawMapInfoWindow", ["ui.config", "$parse", "$compile", function (uiConfig, $parse, $compile) {

    var infoWindowEvents = "closeclick content_change domready " +
        "position_changed zindex_changed";
    var options = uiConfig.mapInfoWindow || {};

    return {
        link: function (scope, elm, attrs) {
            var opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));
            opts.content = elm[0];
            var model = $parse(attrs.bawMapInfoWindow);
            var infoWindow = model(scope);

            if (!infoWindow) {
                infoWindow = new google.maps.InfoWindow(opts);
                model.assign(scope, infoWindow);
            }

            bindMapEvents(scope, infoWindowEvents, infoWindow, elm);

            /* The info window's contents dont' need to be on the dom anymore,
             google maps has them stored. So we just replace the infowindow element
             with an empty div. (we don't just straight remove it from the dom because
             straight removing things from the dom can mess up angular) */
            elm.replaceWith("<div></div>");

            //Decorate infoWindow.open to $compile contents before opening
            var _open = infoWindow.open;
            infoWindow.open = function open(a1, a2, a3, a4, a5, a6) {
                $compile(elm.contents())(scope);
                _open.call(infoWindow, a1, a2, a3, a4, a5, a6);
            };
        }
    };
}]);

/*
 * Map overlay directives all work the same. Take map marker for example
 * <ui-map-marker="myMarker"> will $watch 'myMarker' and each time it changes,
 * it will hook up myMarker's events to the directive dom element. Then
 * ui-event will be able to catch all of myMarker's events. Super simple.
 */
function mapOverlayDirective(directiveName, events) {
    bawds.directive(directiveName, [function () {
        return {
            restrict: "A",
            link: function (scope, elm, attrs) {
                scope.$watch(attrs[directiveName], function (newObject) {
                    bindMapEvents(scope, events, newObject, elm);
                });
            }
        };
    }]);
}

mapOverlayDirective("bawMapMarker", "animation_changed click clickable_changed cursor_changed " + "dblclick drag dragend draggable_changed dragstart flat_changed icon_changed " + "mousedown mouseout mouseover mouseup position_changed rightclick " + "shadow_changed shape_changed title_changed visible_changed zindex_changed");

mapOverlayDirective("bawMapPolyline", "click dblclick mousedown mousemove mouseout mouseover mouseup rightclick");

mapOverlayDirective("bawMapPolygon", "click dblclick mousedown mousemove mouseout mouseover mouseup rightclick");

mapOverlayDirective("bawMapRectangle", "bounds_changed click dblclick mousedown mousemove mouseout mouseover " + "mouseup rightclick");

mapOverlayDirective("bawMapCircle", "center_changed click dblclick mousedown mousemove " + "mouseout mouseover mouseup radius_changed rightclick");

mapOverlayDirective("bawMapGroundOverlay", "click dblclick");

/* End map directives */