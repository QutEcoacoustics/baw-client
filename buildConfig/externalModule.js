/**
 * This module does two things:
 * a) defines a callback for vendor files wrapped in a module.exports shim
 * b) Register's an angular module that dynamically creates angular providers
 *
 * This file must be loaded before vendor files.
 */

// global variable
var angularApplicationNamespace = "bawApp";
window[angularApplicationNamespace] = window[angularApplicationNamespace] || {};
window[angularApplicationNamespace].externals = {};
window[angularApplicationNamespace].externalsCallback = function (error, capturedModule) {
    var that = window[angularApplicationNamespace];

    that.externals[capturedModule.moduleName] = capturedModule;

    that.externalsCallback.count = (that.externalsCallback.count || 0) + 1;

    if (that.externalsCallback.count >= capturedModule.externalModulesCount) {
        that.externalsComplete();
    }
};

// later when vendor assets are done loading
window[angularApplicationNamespace].externalsComplete = function() {
    // define core module
    var moduleName = angularApplicationNamespace + ".vendorServices.auto";
    console.debug("Creating module ", moduleName);
    var vendorModule = angular.module(moduleName, []);

    angular.forEach(window[angularApplicationNamespace].externals, function (value, key) {
        var capturedModule = value,
            providerName = key,
            vendorExport = capturedModule.exports;

        console.debug("Creating provider ", providerName);
        vendorModule.provider(providerName,
                      function () {
                          var vendorInstance = vendorExport;

                          this.configureVendorInstance = function () {
                              return vendorInstance;
                          };

                          this.$get = [function vendorFactory() {

                              return vendorInstance;
                          }];
                      });
    });

    // cleanup
    console.debug("cleaning up vendor externals hack");
    delete window[angularApplicationNamespace].externals;
    delete window[angularApplicationNamespace].externalsComplete;
    window[angularApplicationNamespace].externalsCallback = function() {
        console.error("The vendor externals callback is no longer valid!", arguments);
    }
};