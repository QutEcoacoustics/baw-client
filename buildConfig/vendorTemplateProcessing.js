

module.exports = function(grunt, template, callbackName, ignoreFiles) {
    var fs = require('fs'),
        path = require("path"),
        _ = require('lodash');

    var vendorTemplate = fs.readFileSync(template, "utf-8"),
        ignoreFiles = ignoreFiles || [];


    return function process(content, sourcePath) {


        if (ignoreFiles.indexOf(sourcePath) >= 0) {
            return content;
        }

        grunt.log.ok(sourcePath + " wrapped in vendor template");

        var data = {
            content: content,
            filename: path.basename(sourcePath, path.extname(sourcePath)),
            callbackName: callbackName
        };

        return _.template(vendorTemplate, data);
    };
};