module.exports = function (config) {

    var fileJson = '[<% scripts.forEach( function ( file, index, array ) { %>"<%= file %>"<%= index == array.length - 1 ? "": ","%> <% }); %>]',
        browserToUse = "<%= usePhantomJs ? 'PhantomJS' : 'Chrome' %>",
        useLineCov = "<%= usePhantomJs %>" === "true";


    var configObject = {};

    //logLevel: config.LOG_DEBUG,

    /**
     * From where to look for files, starting with the location of this file.
     */
    configObject.basePath = '../';

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    configObject.files = [
        "vendor/objectdiff/objectDiff.js",
        "vendor/jasmine-matchers/dist/jasmine-matchers.js"
    ].concat(JSON.parse(fileJson).concat([
            'src/**/*.js',
            'src/**/*.spec.js'
        ]));

    configObject.exclude = [
        'src/assets/**/*.js'
    ];

    configObject.frameworks = [ 'jasmine' ];
    configObject.plugins = [
        'karma-jasmine',
        'karma-firefox-launcher',
        /*'karma-chrome-launcher',*/
        require('../node_modules/karma-chrome-launcher'),
        'karma-phantomjs-launcher'
        /*require('../node_modules/karma-phantomjs-launcher'),*/
    ];

    configObject.preprocessors = {

    };

    /**
     * How to report, by default. 'dots', 'progress'
     */
    configObject.reporters = ['dots'];

    /**
     * Set up the coverage reporter
     */
    if (useLineCov) {
        configObject.coverageReporter = {
            type: 'lcov',
            dir: 'coverage/'
        };

        configObject.reporters.push('coverage');
        configObject.plugins.push('karma-coverage');
        configObject['src/**/!(*.spec)+(.js)'] = 'coverage';
    }

    /**
     * On which port should the browser connect, on which port is the test runner
     * operating, and what is the URL path for the browser to use.
     */
    configObject.port = 9018;
    configObject.runnerPort = 9100;
    configObject.urlRoot = '/';

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
    configObject.browsers = [ browserToUse ];


    config.set(configObject);
};
