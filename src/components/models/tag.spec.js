describe("The Tag object", function () {

    var newTag;
    var existingTag;
    var TagModel;
    var resource = {
        "createdAt": "2013-11-20T13:19:13Z",
        "creatorId": 7,
        "id": 1,
        "isTaxanomic": false,
        "notes": {},
        "retired": false,
        "text": "Corvus Orru",
        "typeOfTag": "species_name",
        "updatedAt": "2013-11-20T13:19:13Z",
        "updaterId": 7
    };
    var resourceTypes = {
        "createdAt": Date,
        "creatorId": Number,
        "id": Number,
        "isTaxanomic": Boolean,
        "notes": Object,
        "retired": Boolean,
        "text": String,
        "typeOfTag": String,
        "updatedAt": Date,
        "updaterId": Number
    };

    beforeEach(module("bawApp.models", "rails"));

    beforeEach(inject(["baw.models.Tag", function (_TagModel_) {
        TagModel = _TagModel_;
        newTag = new TagModel(true);
        existingTag = new TagModel(resource);
    }]));


    it("should not be found globally", function () {
        var type = window.TagModel;
        expect(type).toBeUndefined();
    });

    it("should throw if called like a function", function () {
        var func = function () {
            TagModel(true); // jshint ignore:line
        };

        expect(func).toThrowError("Constructor called as a function");
    });

    it("should throw if not given a bool or object", function () {
        var f = function () {
            new TagModel(3);
        };

        expect(f).toThrow();
    });

    it("should expose all the resource with its own api - with an existing resource", function () {
        expect(existingTag).toImplement(resourceTypes);
    });

    // jasmineMatchers' toImplement current does not support testing for fields with null values
    xit("should expose all the resource with its own api - with a new resource", function () {
        expect(newTag).toImplement(resourceTypes);
    });

    var dateFields = [
        "createdAt",
        "updatedAt"];
    Object.keys(resource).forEach(function (key) {
        it("should copy the value of " + key + " into the object", function () {
            var expected = (existingTag[key]);
            var actual = (resource[key]);

            if (dateFields.indexOf(key) >= 0) {
                actual = new Date(actual);
                expect(expected).toBeDate(actual);
            }
            else {
                expect(expected).toBe(actual);
            }
        });
    });

    it("should have a name property that mirrors the text property", function () {
        var propExists = existingTag.hasOwnProperty("name");
        expect(propExists).toBeTrue();

        expect(existingTag.name).toEqual(existingTag.text);

        existingTag.text = "testing";

        expect(existingTag.name).toEqual(existingTag.text);

        existingTag.name = "donkey";

        expect(existingTag.name).toEqual(existingTag.text);
    });


    it("should have a value property that mirrors the id property", function () {
        var propExists = existingTag.hasOwnProperty("value");
        expect(propExists).toBeTrue();

        expect(existingTag.value).toEqual(existingTag.id);

        existingTag.id = "testing";

        expect(existingTag.value).toEqual(existingTag.id);

        existingTag.value = "donkey";

        expect(existingTag.value).toEqual(existingTag.id);
    });

    it("should have a group property that mirrors the typeOfTag property", function () {
        var propExists = existingTag.hasOwnProperty("group");
        expect(propExists).toBeTrue();

        expect(existingTag.group).toEqual(existingTag.typeOfTag);

        existingTag.typeOfTag = "testing";

        expect(existingTag.group).toEqual(existingTag.typeOfTag);

        existingTag.group = "donkey";

        expect(existingTag.group).toEqual(existingTag.typeOfTag);
    });


});