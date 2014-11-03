/**
 * Support for interacting with D3
 * Each d3 chart should have its own directive.
 * Each directive should require the D3 service.
 */
var bawD3 = bawD3 || angular.module("bawApp.d3", []);
/**
 * This wrapper is pretty simple.
 * We do this for modularity's sake and to fit in with the angular pattern.
 * This provider has the potential for runtime configuration:
 * (inject d3Provider into a config function).
 */
bawD3.provider("d3", function () {

        // TODO: is there a better way to load d3, without it attaching to the window?
        var d3 = window.d3;

        this.$get = [function d3Factory() {
            return d3;
        }];
    });