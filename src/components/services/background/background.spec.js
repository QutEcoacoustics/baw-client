describe("The background service", function () {

    var backgroundImage;
    var paths;
    var $compile;
    var $rootScope;
    var $timeout;
    var testExistingImage = "https://upload.wikimedia.org/wikipedia/commons/0/06/Kitten_in_Rizal_Park%2C_Manila.jpg";
    var $httpBackend;

    beforeEach(module("bawApp.components.background"));
    beforeEach(module("bawApp.configuration"));
    beforeEach(inject(["backgroundImage", "conf.paths", "$compile", "$rootScope", "$timeout", "$httpBackend", "$injector",
        function (_backgroundImage, _paths, _$compile_, _$rootScope_, _$timeout_, $http, $injector) {
            $httpBackend = $injector.get("$httpBackend");
            backgroundImage = _backgroundImage;
            paths = _paths;
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;

            $httpBackend.when("GET", "/public/citizen_science/samples/images.json").respond(200, {
                data: [
                    {"filename": "1.jpg", "siteId": 402, "date": "2010-10-14 00:00:00"},
                    {"filename": "2.jpg", "siteId": 312, "date": "2010-08-01 12:00:00"},
                    {"filename": "3.jpg", "siteId": 399, "date": "2010-10-30 15:00:00"},
                    {"filename": "4.jpg", "siteId": 402, "date": "2010-10-14 00:03:00"}
                ]
            }, {"content-type": "application/json"});

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