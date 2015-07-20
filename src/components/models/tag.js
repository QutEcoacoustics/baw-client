angular
    .module("bawApp.models.tag", [])
    .factory(
    "baw.models.Tag",
    [
        "baw.models.associations",
        "conf.paths",
        "Authenticator",
        "$url",
        function (associations, paths, Authenticator, url) {

            function Tag(resourceOrNewTag) {

                var newTag = resourceOrNewTag === true;

                var resource;
                if (!newTag) {
                    if (angular.isObject(resourceOrNewTag)) {
                        resource = resourceOrNewTag;
                    }
                    else {
                        throw "Neither and new tag or a resource has been provided";
                    }
                }

                if (!(this instanceof Tag)) {
                    throw new Error("Constructor called as a function");
                }

                this.id = newTag ? null : resource.id;

                this.createdAt = !newTag && resource.createdAt ? new Date(resource.createdAt) : null;
                this.creatorId = newTag ? null : resource.creatorId;
                this.updatedAt = !newTag && resource.updatedAt ? new Date(resource.updatedAt) : null;
                this.updaterId = newTag ? null : resource.updaterId;

                this.isTaxanomic = newTag ? false : resource.isTaxanomic;
                this.typeOfTag = newTag ? Tag.tagTypes.general : resource.typeOfTag;
                this.notes = newTag ? {} : resource.notes;
                this.retired = newTag ? false : resource.retired;
                this.text = newTag ? null : resource.text;

                // for the tagging UI special properties are needed for binding
                Object.defineProperty(this, "name", {
                    enumerable: true,
                    configurable: false,
                    get: function () {
                        return this.text;
                    },
                    set: function (value) {
                        if (value !== this.text) {
                            this.text = value;
                        }
                    }
                });

                Object.defineProperty(this, "value", {
                    enumerable: true,
                    configurable: false,
                    get: function () {
                        return this.id;
                    },
                    set: function (value) {
                        if (value !== this.id) {
                            this.id = value;
                        }
                    }
                });

                Object.defineProperty(this, "group", {
                    enumerable: true,
                    configurable: false,
                    get: function () {
                        return this.typeOfTag;
                    },
                    set: function (value) {
                        if (value !== this.typeOfTag) {
                            this.typeOfTag = value;
                        }
                    }
                });


            }

            Tag.tagTypes = Object.freeze({
                general: "general",
                soundsLike: "sounds_like",
                looksLike: "looks_like",
                commonName: "common_name",
                speciesName: "species_name"
            });

            Tag.make = function make(value) {
                return new Tag(value);
            };

            Tag.makeFromApi = associations.makeFromApi(Tag);

            return Tag;
        }]);
