describe("The resultPager factory", function () {

    var $httpBackend, resultPager, $rootScope, _, $http;

    beforeEach(module("bawApp.services"));

    const allItems = Array.from(new Array(110).keys()),
        pageSize = 25;

    function setUpEndpoints(getOrPost, pages = [1, 2, 3, 4, 5]) {
        _.chunk(allItems, pageSize).forEach(function (items, index, arr) {

            let currentUrl = (b) => `/${b}?direction=desc&items=25&orderBy=created_at&page=${ index + 1 }`;

            var paging = (b) => ({
                "paging": {
                    "page": index + 1,
                    "items": pageSize,
                    "total": allItems.length,
                    "max_page": arr.length,
                    "current": currentUrl(b),
                    "previous": `/${b}?direction=desc&items=25&order_by=created_at&page=${ index }"`,
                    "next": `/${b}?direction=desc&items=25&order_by=created_at&page=${index + 2}`
                },
                "sorting": {
                    "order_by": "created_at",
                    "direction": "desc"
                }
            });

            if (getOrPost === "GET") {
                $httpBackend.when("GET", index === 0 ? "/test" : currentUrl("test"))
                    .respond(200, {data: items, meta: paging("test")}, {"content-type": "application/json"});
            }
            else if (getOrPost === "POST") {
                var data;
                if (index !== 0) {
                    data = {
                        "paging": {"items": 25, "page": index + 1},
                        "sorting": {"order_by": "created_at", "direction": "desc"}
                    };
                } else {
                    data = {filter: {}};
                }
                $httpBackend.when("POST", "/test/filter", data)
                    .respond(200, {data: items, meta: paging("test/filter")}, {"content-type": "application/json"});
            }
            else {
                throw "Not a valid choice";
            }
        });
    }

    beforeEach(inject(
        ["$injector", "lodash", "ResultPager", "$rootScope", "$http", function ($injector, _lodash, _resultPager, _$rootScope, _$http) {
            $httpBackend = $injector.get("$httpBackend");
            _$http.defaults.headers.common.Authorization = "SOME AUTH TOKEN";
            _$http.defaults.headers.common.Accept = "application/json";

            _ = _lodash;
            resultPager = _resultPager;
            $rootScope = _$rootScope;
            $http = _$http;


        }]));

    it("should return a resource constructor that includes update/put", function () {

        expect(resultPager).toImplement({
            "skip": Function,
            "take": Function,
            "loadAll": Function
        });
    });

    it("should ignore bad responses", function (done) {
        $httpBackend.expectGET("/bad").respond(500, {});

        var response;
        $http
            .get("/bad")
            .then(resultPager.loadAll)
            .then(undefined, r => {
                response = r;
            });

        $httpBackend.flush();

        var result = response.data.data;
        expect(result).toBeUndefined();

        done();
    });

    it("should ignore responses with no pageable items", function (done) {
        $httpBackend.expectGET("/no_pages").respond(200, {
            meta: {},
            data: [0, 1, 2, 3, 4, 5]
        });

        var response;
        $http
            .get("/no_pages")
            .then(resultPager.loadAll)
            .then(r => response = r);

        $httpBackend.flush();

        var result = response.data.data;
        expect(result).toBeDefined();
        expect(result).toEqual([0, 1, 2, 3, 4, 5]);

        done();
    });

    it("should get all pages - GET", function (done) {
        setUpEndpoints("GET");

        var response;
        $http
            .get("/test")
            .then(resultPager.loadAll)
            .then(r => response = r)
            .catch((e) => {
                throw e;
            });

        $httpBackend.flush();

        var result = response.data.data;
        expect(result).toBeDefined();
        expect(result).toEqual(allItems);

        done();
    });

    it("should get all pages - POST", function (done) {
        setUpEndpoints("POST");

        var response;
        $http
            .post("/test/filter", {filter: {}})
            .then(resultPager.loadAll)
            .then(r => response = r)
            .catch((e) => {
                throw e;
            });

        $httpBackend.flush();


        var result = response.data.data;
        expect(result).toBeDefined();
        expect(result).toEqual(allItems);

        done();
    });
});