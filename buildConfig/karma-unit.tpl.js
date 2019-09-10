module.exports = function (config) {

    var fileJson = '[<% scripts.forEach( function ( file, index, array ) { %>"<%= file %>"<%= index == array.length - 1 ? "": ","%> <% }); %>]', // jshint ignore:line
        vendorJson = '[<% vendorFiles.forEach( function ( file, index, array ) { %>"<%= file %>"<%= index == array.length - 1 ? "": ","%> <% }); %>]', // jshint ignore:line
        browserToUse = "<%= usePhantomJs ? 'PhantomJS' : 'Chrome' %>",
        useLineCov = "<%= usePhantomJs %>" === "true";


    var configObject = {};

    //logLevel: config.LOG_DEBUG,

    /**
     * From where to look for files, starting with the location of this file.
     */
    configObject.basePath = "../";

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    configObject.files = [
        "vendor/objectdiff/objectDiff.js",
        "vendor/jasmine-expect/dist/jasmine-matchers.js"
    ].concat(JSON.parse(fileJson).concat([
            "es6/**/*.js",
            "es6/**/*.spec.js"
        ]));

    // HACK!: use vendor files out of the build directory since they undergo a transform on build
    var transformedVendorFiles = JSON.parse(vendorJson);
    configObject.files = configObject.files.map(function (value) {
        return transformedVendorFiles.indexOf(value) >= 0 ? "build/" + value : value;
    });

    configObject.exclude = [
        "es6/assets/**/*.js"
    ];

    configObject.frameworks = [ "jasmine" ];
    configObject.plugins = [
        "karma-jasmine",
        "karma-firefox-launcher",
        /*'karma-chrome-launcher',*/
        require("../node_modules/karma-chrome-launcher"),
        "karma-phantomjs-launcher",
        /*require('../node_modules/karma-phantomjs-launcher'),*/
        "karma-sourcemap-loader",
        require("../node_modules/karma-jasmine-diff-reporter")
    ];

    configObject.preprocessors = {
        '**/*.js': ["sourcemap"]
    };

    /**
     * How to report, by default. 'dots', 'progress'
     */
    configObject.reporters = ["jasmine-diff", "dots"];

    /**
     * Set up the coverage reporter
     */
    if (useLineCov) {
        configObject.coverageReporter = {
            type: "lcov",
            dir: "coverage/"
        };

        configObject.reporters.push("coverage");
        configObject.plugins.push("karma-coverage");
        configObject.preprocessors["es6/**/!(*.spec)+(.js)"] = "coverage";
    }

    /**
     * On which port should the browser connect, on which port is the test runner
     * operating, and what is the URL path for the browser to use.
     */
    configObject.port = 9018;
    configObject.runnerPort = 9100;
    configObject.urlRoot = "/";

    /**
     * Disable file watching by default.
     */
    configObject.autoWatch = false;

    /**
     * The list of browsers to launch to test on. This includes only "Firefox" by
     * default, but other browser names include:
     * Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
     *
     * Note that you can also use the executable name of the browser, like "chromium"
     * or "firefox", but that these vary based on your operating system.
     *
     * You may also leave this blank and manually navigate your browser to
     * http://localhost:9018/ when you're running tests. The window/tab can be left
     * open and the tests will automatically occur there during the build. This has
     * the aesthetic advantage of not launching a browser every time you save.
     */
    // in docker container, don't launch browser, but map the ports so we can launch the browser manually in the host.

    configObject.browsers = [  ];

    config.colors = true;

    config.set(configObject);
};
