describe("The predictiveCache service", function () {

    var predictiveCache;

    beforeEach(module("bawApp.services"));

    beforeEach(inject(["predictiveCache", function (_predictiveCache) {
        predictiveCache = _predictiveCache;
    }]));

    var testProfile = {
        name: "Media cache ahead",
        match: /google\.com\?page=(.*)&skip=(.*)/,
        request: ["one url", "another url"],
        progression: [
            function(data, previous) {
                return previous + 30.0;
            },
            function(data, previous) {
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


    it("requires an object to function", function() {
        expect(function() {
            predictiveCache();
        }).toThrowError(Error, "A profile is required");

    });
});