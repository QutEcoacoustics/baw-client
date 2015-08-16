describe("The bookmark service", function () {

    var bawResource;

    beforeEach(module("bawApp.models", "rails"));
    beforeEach(module("bawApp.services"));

    beforeEach(inject(["Bookmark", function (providedBawResource) {
        bawResource = providedBawResource;
    }]));


    it("will return a promise for retrieving application bookmarks", function() {

        expect(bawResource.applicationBookmarksPromise).toImplement({
            catch: null,
            finally: null,
            then: null
        });
    });
});