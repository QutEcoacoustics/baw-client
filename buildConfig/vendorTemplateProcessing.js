

module.exports = function(grunt, template, callbackName, includeFiles) {
    var fs = require('fs'),
        path = require("path"),
        _ = require('lodash');

    var vendorTemplate = fs.readFileSync(template, "utf-8"),
        includeFiles = includeFiles || [];


    return function process(content, sourcePath) {


        if (includeFiles.indexOf(sourcePath) === -1) {
            return content;
        }

        grunt.log.ok(sourcePath + " wrapped in vendor template");

        var data = {
            content: content,
            filename: path.basename(sourcePath, path.extname(sourcePath)),
            callbackName: callbackName,
            externalModulesCount: includeFiles.length
        };

        return _.template(vendorTemplate)(data);
    };
};