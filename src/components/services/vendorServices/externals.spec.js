describe("The vendor services", function () {

    beforeEach(module("bawApp.vendorServices"));

    beforeEach(inject([function () {


    }]));

    it("checks that bawApp.vendorServices.auto has been created", function () {
        var vendorServicesAutoModule = angular.module("bawApp.vendorServices.auto");
        expect(vendorServicesAutoModule).not.toBeNull();
    });

    it("checks bowser is not on the global scope", function () {
        expect(window.bowser).not.toBeDefined();
    });

    it("checks the bowser auto service was created",
       inject(["bowser", function (bowser) {
           expect(bowser).toBeDefined();
       }]));

    it("checks moment is not on the global scope", function () {
        expect(window.moment).not.toBeDefined();
    });

    it("checks the moment auto service was created",
       inject(["moment", function (moment) {
           expect(moment).toBeDefined();
       }]));

    it("checks lodash is not on the global scope", function () {
        expect(window._).not.toBeDefined();
    });

    it("checks the lodash auto service was created",
       inject(["lodash", function (lodash) {
           expect(lodash).toBeDefined();
       }]));

    it("checks humanizeDuration is not on the global scope", function () {
        expect(window.humanizeDuration).not.toBeDefined();
    });

    it("checks the humanizeDuration auto service was created",
       inject(["humanize-duration", function (humanizeDuration) {
           expect(humanizeDuration).toBeDefined();
       }]));

    it("checks d3 is not on the global scope", function () {
        expect(window.d3).not.toBeDefined();
    });

    it("checks the d3 auto service was created",
       inject(["d3", function (d3) {
           expect(d3).toBeDefined();
       }]));
});