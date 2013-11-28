//noinspection JSUnresolvedFunction
describe("The Annotation object", function () {

    var annotation_local;
    var annotation_resource;

    var tagging = {

        "audioEventId": 10,
        "createdAt": "2013-11-28T08:16:52Z",
        "creatorId": 7,
        "id": 4,
        "tagId": 13,
        "updatedAt": "2013-11-28T08:16:52Z",
        "updaterId": 7
    };

    var resource = {
        "audioRecordingId": 40,
        "createdAt": "2013-11-06T03:54:35Z",
        "creatorId": 7,
        "deletedAt": "2013-11-11T03:54:35Z",
        "deleterId": 9,
        "endTimeSeconds": 11,
        "highFrequencyHertz": 9819,
        "id": 1,
        "isReference": false,
        "lowFrequencyHertz": 5081,
        "startTimeSeconds": 7,
        "updatedAt": "2013-11-06T03:54:35Z",
        "updaterId": 8,
        "taggings": [
            tagging
        ]
    };

    beforeEach(function () {
        annotation_local = new baw.Annotation(-1, "audioReadingId");
        annotation_resource = new baw.Annotation(resource);

    });

    afterEach(function () {
        describe("Invariant:", function () {
            it("isDirty should be boolean", function () {
                expect(annotation_local.isDirty).toBeBoolean();
                expect(annotation_resource.isDirty).toBeBoolean();
            });
        });
    });

    it("should be found globally", function () {
        var type = typeof baw.Annotation;
        expect(type).toEqual("function");
    });

    it("should not be null", function () {
        expect(annotation_local).not.toBeNull();
        expect(annotation_resource).not.toBeNull();
    });

    it("the localId mode to throw if not given a number", function () {
        var func = function () {
            var annotation = new baw.Annotation();
        };

        var func2 = function () {
            var annotation = new baw.Annotation("30");
        };

        expect(func).toThrow("Valid input not provided");
        expect(func2).toThrow("Valid input not provided");
    });

    it("the localId to be negative for a new annotation", function () {

        expect(annotation_local.__localId__).toBeLessThan(0);
        expect(annotation_local.id).toBeNull();

    });

    it("a new annotation should say so", function () {

        expect(annotation_local.isNew()).toBeTrue();
    });

    it("the localId to be the same as the id for an existing annotation", function () {

        expect(annotation_resource.id).toBeGreaterThan(0);
        expect(annotation_resource.id).toBe(resource.id);
        expect(annotation_resource.__localId__).toBe(annotation_resource.id);

    });

    it("an existing annotation should say so", function () {

        expect(annotation_resource.isNew()).toBeFalse();
    });

    it("the localId mode to throw if not given a number", function () {
        var func = function () {
            var annotation = new baw.Annotation();
        };

        var func2 = function () {
            var annotation = new baw.Annotation("30");
        };

        expect(func).toThrow("Valid input not provided");
        expect(func2).toThrow("Valid input not provided");
    });

    it("'s prototype should have all of the resource properties defined", function () {
        expect(baw.Annotation.prototype).toImplement({isNew: null, mergeResource: null, exportObj: null});

    });

    var dateFields = [
        "createdAt",
        "updatedAt",
        "deletedAt"];
    Object.keys(resource).forEach(function (key) {
        it("should copy the value of " + key + " into the object", function () {
            var expected = (annotation_resource[key]);
            var actual = (resource[key]);

            if (dateFields.indexOf(key) >= 0) {
                actual = new Date(actual);
                expect(expected).toBeDate(actual);
            }
            else if (key === "taggings") {
                var type = typeof actual;
                for (var i = 0; i < expected.length; i++) {
                    var tagging = expected[i];
                    var isInstance = tagging instanceof baw.Tagging;
                    expect(isInstance).toBeTrue();
                }
            }
            else {
                expect(expected).toBe(actual);
            }
        });
    });


    it("should have a dirty property", function () {
        expect(annotation_local.isDirty).toBeDefined();
    });

    it("should not be dirty if it has been selected", function () {
        annotation_local.isDirty = false;

        annotation_local.selected = true;
        expect(annotation_local.isDirty).toBeFalse();

        annotation_local.selected = false;
        expect(annotation_local.isDirty).toBeFalse();
    });

    it("should be dirty if it has just been created", function () {
        expect(annotation_local.isDirty).toBeTrue();
    });

    it("should not be dirty if it has just been converted from an existing resource", function () {
        expect(annotation_resource.isDirty).toBeFalse();
    });

    describe("bounding boxes dimensions change, then a", function () {

        it("should ensure the properties exist", function () {
            expect(annotation_resource.endTimeSeconds).toBeDefined();
            expect(annotation_resource.highFrequencyHertz).toBeDefined();
            expect(annotation_resource.lowFrequencyHertz).toBeDefined();
            expect(annotation_resource.startTimeSeconds).toBeDefined();
        });

        ["endTimeSeconds", "highFrequencyHertz", "lowFrequencyHertz", "startTimeSeconds"].forEach(function (value) {
            it("Δ in " + value + " → a change in the private value _" + value, function () {
                var newValue = annotation_resource[value] * (Math.random() + 0.5);
                var oldValue = annotation_resource[value];
                var oldPrivateValue = annotation_resource["_" + value];

                annotation_resource[value] = newValue;

                expect(oldValue).toBe(oldPrivateValue);

                expect(annotation_resource[value]).toBe(newValue);

                expect(annotation_resource["_" + value]).toBe(newValue);
            });

            it("Δ in " + value + " → isDirty ", function () {
                annotation_resource[value] = annotation_resource[value] * (Math.random() + 0.5);

                expect(annotation_resource.isDirty).toBeTrue();
            });

            it("a Δ in " + value + " === 0.0, → !isDirty", function () {
                annotation_resource[value] = annotation_resource[value];

                expect(annotation_resource.isDirty).toBeFalse();
            });
        });


    });

    it("should be dirty if isReference is modified", function () {
        expect(annotation_resource.isDirty).toBeFalse();
        annotation_resource.isReference = !annotation_resource.isReference;
        expect(annotation_resource.isDirty).toBeTrue();
    });




    it("should have a taggings array, with taggings in it", function () {
        var propExists = annotation_resource.hasOwnProperty("taggings");
        expect(propExists).toBeTrue();

        expect(annotation_resource.taggings).toBeArrayOfObjects("taggings");
    });

    it("should have a tags array, with tags in it", function () {
        var propExists = annotation_resource.hasOwnProperty("tags");
        expect(propExists).toBeTrue();

        expect(annotation_resource.taggings).toBeArrayOfObjects("tags");
    });



});