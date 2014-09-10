describe("The bawResource service", function () {

    var Bookmark;

    beforeEach(module('bawApp.services'));

    beforeEach(inject(["Bookmark", function (providedBookmark) {
        Bookmark = providedBookmark;
    }]));


    it("should return a resource constructor that includes update/put", function () {

        expect(Bookmark).toImplement({
            "get": null,
            "save": null,
            "query": null,
            "remove": null,
            "delete": null,
            "update": null,
            "modifiedPath": null
        });
    });
});