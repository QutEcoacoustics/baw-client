describe("The predictiveCache service", function () {

    var predictiveCache;
    var testProfile;
    beforeEach(module("bawApp.services"));

    beforeEach(inject(["predictiveCache", function (_predictiveCache) {
        predictiveCache = _predictiveCache;

        testProfile = {
            name: "Media cache ahead",
            match: /google\.com\?page=(.*)&skip=(.*)/,
            request: ["one url", "another url"],
            progression: [
                30.0,
                function (data, previous) {
                    var next = previous + 30.0;
                    if (next >= data.max) {
                        return;
                    }
                    else {
                        return next;
                    }
                }
            ],
            count: 10,
            method: "HEAD"
        };
    }]));


    it("requires an object to function", function () {
        expect(function () {
            predictiveCache();
        }).toThrowError(Error, "A profile is required");

    });

    it("returns the profile that was passed into it", function () {
        var profile = predictiveCache(testProfile);

        var pj = JSON.stringify(profile),
            tj = JSON.stringify(testProfile);

        expect(pj).toBe(tj);
    });

    it("expects the profile to accept the http verbs", function () {
        var verbs = ["GET", "HEAD", "POST", "PUT", "DELETE"];

        // should occur without exception
        verbs.forEach(function (verb) {
            testProfile.method = verb;
            predictiveCache(testProfile);
        });

        expect(function () {
            testProfile.method = "anything else";
            predictiveCache(testProfile);
        }).toThrowError(Error, "A valid http method is required");
    });

    it("sets the default http verb to HEAD if omitted", function () {
        delete testProfile.method;
        var profile = predictiveCache(testProfile);

        expect(profile.method).toBe("HEAD");
    });

    it("requires name to be a string", function () {
        testProfile.name = 33;

        expect(function () {
            predictiveCache(testProfile);
        }).toThrowError("The provided name must be a string");
    });

    it("will provide an automatic name if one is not supplied", function () {
        delete testProfile.name;
        var profile = predictiveCache(testProfile);
        expect(profile.name).toBe("UnnamedProfile1");

        profile = predictiveCache(testProfile);
        expect(profile.name).toBe("UnnamedProfile2");
    });

    it("will fail if the supplied match regular expression is missing", function () {
        delete testProfile.match;

        expect(function () {
            predictiveCache(testProfile);
        }).toThrowError("A value for match must be provided");
    });

    it("will fail if the supplied match regular expression is not a RegExp", function () {
        testProfile.match = "test";

        expect(function () {
            predictiveCache(testProfile);
        }).toThrowError("The value for match must be a regular expression");
    });

    it("ensures the request value is an array of strings", function () {
        var failValues = [null, [], 33, [33]];

        failValues.forEach(function (item) {
            testProfile.request = item;

            expect(function () {
                predictiveCache(testProfile);
            }).toThrowError("requests must be an array of strings");
        });
    });

    [
        {key: "null", in: null, out: 1},
        {key: "undefined", in: undefined, out: 1},
        {key: "number", in: 3, out: 3},
        {key: "array of numbers or functions", in: [1, function (i) {return i;}]}
    ].forEach(function (progressionTest) {
            it("allows the progression value to be " + progressionTest.key, function () {
                testProfile.progression = progressionTest.in;

                var profile = predictiveCache(testProfile);
                expect(profile.progression).toBe(progressionTest.out || progressionTest.in);
            });
        });

    [
        {key: "a string", in: "test"},
        {key: "empty array", in: []},
        {key: "array not of numbers or functions, strings", in: ["testing"]},
        {key: "array not of numbers or functions, null/undefined", in: [null, undefined, 3.0]},
        {key: "array not of numbers or functions, object", in: [{}]}
    ].forEach(function (progressionTest) {
            it("disallows the progression value to be " + progressionTest.key, function () {
                testProfile.progression = progressionTest.in;

                expect(function() {
                var profile = predictiveCache(testProfile);
                }).toThrowError("progression must be an array of numbers/functions");
            });
        });

    it("ensures count is a number", function() {
        var profile = predictiveCache(testProfile);
        expect(profile.count).toBe(testProfile.count);

        testProfile.count = "fkasnfiabfias";
        expect(function() {
            predictiveCache(testProfile)
        }).toThrowError("count must be a positive integer");

        testProfile.count = -1;
        expect(function() {
            predictiveCache(testProfile)
        }).toThrowError("count must be a positive integer");
    });

    it("allows a default value to be used for count", function() {
        delete testProfile.count;

        var profile = predictiveCache(testProfile);
        expect(profile.count).toBe(10);

    })
});