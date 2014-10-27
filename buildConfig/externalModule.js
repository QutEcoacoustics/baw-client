/**
 * This module does two things:
 * a) defines a callback for vendor files wrapped in a module.exports shim
 * b) Register's an angular module that dynamically creates angular providers
 *
 * This file must be loaded before vendor files.
 */

// global variable
window.bawApp = window.bawApp || {};
window.bawApp.externals = {};
window.bawApp.externalsCallback = function (error, module) {
    window.bawApp.externals[module.name] = module;
};



// later when vendor assets are done loading
(function(window) {
    var moduleNames = [];
    angular.forEach(window.bawApp.externals, function (value, key) {
        var moduleName = "bawApp.vendorServices." + key;

        angular
            .module(moduleName, [])
            .provider(key,
                      function () {
                          var vendorInstance = value;

                          this.configureVendorInstance = function (instance) {
                              return vendorInstance;
                          };

                          this.$get = [function vendorFactory() {

                              return vendorInstance;
                          }];
                      });

        moduleNames.push(moduleName);
    });

    // define core module
    angular.module("bawApp.vendorServices", moduleNames);
})(window);