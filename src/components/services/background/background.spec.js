describe("The background service", function () {

    var backgroundImage;
    var paths;
    var $compile;
    var $rootScope;
    var $timeout;
    var testExistingImage = "https://upload.wikimedia.org/wikipedia/commons/0/06/Kitten_in_Rizal_Park%2C_Manila.jpg";

    beforeEach(module("bawApp.components.background"));
    beforeEach(module("bawApp.configuration"));
    beforeEach(inject(["backgroundImage", "conf.paths", "$compile", "$rootScope", "$timeout", function (_backgroundImage, _paths, _$compile_, _$rootScope_, _$timeout_) {
        backgroundImage = _backgroundImage;
        paths = _paths;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
    }]));


    it("should add a div with class background as the first child of the body", function () {

        var element = $compile("<background></background>")($rootScope);
        $rootScope.$digest();
        backgroundImage.currentBackground = testExistingImage;
        $rootScope.$digest();
        var backgroundTag = element[0].firstElementChild.tagName;
        expect(backgroundTag).toBe("DIV");

    });

    describe("background added then wait a few seconds", function () {

        var element;

        beforeEach(function (done) {

            element = $compile("<background></background>")($rootScope);
            $rootScope.$digest();
            backgroundImage.currentBackground = testExistingImage;
            $rootScope.$digest();

            setTimeout(function () {
                $timeout.flush();
                done();
            }, 4004);

        });

        it("should add a div that has class of done", function () {
            var isDone = element[0].firstElementChild.classList.contains("done");
            expect(isDone).toBe(true);
        });

    });

    describe("multiple backgrounds added then wait a few seconds", function () {

        var element;

        beforeEach(function (done) {

            element = $compile("<background></background>")($rootScope);
            $rootScope.$digest();
            backgroundImage.currentBackground = testExistingImage;
            $rootScope.$digest();
            backgroundImage.currentBackground = testExistingImage;
            $rootScope.$digest();
            backgroundImage.currentBackground = testExistingImage;
            $rootScope.$digest();

            setTimeout(function () {
                $timeout.flush();
                done();
            }, 4004);

        });

        it("should only have one background image div, because others have been cleaned up", function () {

            expect(element[0].childElementCount).toBe(1);
        });

    });

});