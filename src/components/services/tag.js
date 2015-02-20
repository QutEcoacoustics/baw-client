/**
 * A Service for dealing with textual Tags
 *
 * This service memoises requests for tags
 */
angular
    .module("bawApp.services.tag", [])
    .factory(
    "Tag",
    [
        '$resource', "bawResource", 'conf.paths', "lodash",
        function ($resource, bawResource, paths, _) {

            function wrap(resource, method, injection) {
                var wrappedMethod = resource[method];

                resource[method] = function (params, data, success, error) {
                    if (arguments.length != 4) {
                        throw "we are doing some funky stuff on this resource method... expecting exactly 4 arguments [params, data, success, error]";
                    }

                    var newSuccess = function (value, headers) {
                        injection(value, headers);
                        success(value, headers);
                    };

                    return wrappedMethod.call(wrappedMethod, params, data, newSuccess, error);
                };
            }


            var resource = $resource(bawResource.uriConvert(paths.api.routes.tag.showAbsolute), {tagId: '@tagId'}, {});

            var tags = {};

            function memoize(result) {
                if (angular.isArray(result)) {
                    angular.forEach(result, function (value) {
                        tags[value.id] = value;
                    });
                }
                else {
                    tags[result.id] = result;
                }
            }

            wrap(resource, "get", memoize);
            wrap(resource, "query", memoize);

            resource.resolve = function resolveTag(id) {
                var tag = tags[id];
                return tag;
            };

            function search(id, tagsArray) {
                return _.find(tagsArray, function (tagValue) {
                    return id === tagValue.id;
                });
            }

            /**
             * By reference, ensure every item in srcArray has a proper tag object reference.
             * @param srcArray
             * @param tagsArray
             */
            resource.resolveAll = function (srcArray, tagsArray) {
                if (!tagsArray || tagsArray.length === 0) {
                    return;
                    //throw "Tag resolverAll, search array empty.";
                }

                for (var i = 0; i < srcArray.length; i++) {
                    if (srcArray[i].resolve) {
                        var found = search(srcArray[i].id, tagsArray);
                        if (found) {
                            srcArray[i] = found;
                        }
                    }
                }
            };


            var emptyTag = {
                text: "<no tags>",
                typeOfTag: ""
            };

            resource.selectSinglePriorityTag = function selectSinglePriorityTag(tags) {

                // which tag to show?
                // common name, then species_name, then if all else fails... whatever is first

                if (!tags || tags.length === 0) {
                    return emptyTag;
                }

                var first = tags[0];


                // optimise for most common case
                // also: on load, only incomplete tags will be listed --> the tag resolver then runs for every tag, just below
                if (first.typeOfTag == baw.Tag.tagTypes.commonName) {
                    return first;
                }
                else {
                    var commonName, speciesName, firstOther;
                    tags.forEach(function (value) {


                        if (value.typeOfTag == baw.Tag.tagTypes.commonName && !commonName) {
                            commonName = value;
                        }
                        if (value.typeOfTag == baw.Tag.tagTypes.speciesName && !speciesName) {
                            speciesName = value;
                        }
                        if (!firstOther) {
                            firstOther = value;
                        }
                    });

                    return commonName || speciesName || firstOther;
                }
            };

            return resource;
        }
    ]
);