describe("The bawResource service", function () {

    var $httpBackend, bawResource, $rootScope;

    beforeEach(module("bawApp.services"));

    beforeEach(inject(["$injector", "bawResource", "$rootScope", "$http", function ($injector, providedBawResource, _$rootScope, $http) {
        $httpBackend = $injector.get("$httpBackend");
        $http.defaults.headers.common.Authorization = "SOME AUTH TOKEN";

        $httpBackend.when("GET", "/test").respond({data:[], meta:{}});

        bawResource = providedBawResource;
        $rootScope = _$rootScope;
    }]));

    // jasmineMatchers' toImplement currently does not support testing for fields on Function objects
    xit("should return a resource constructor that includes update/put", function () {
        var resource = bawResource("/test");
        expect(resource).toImplement({
            "get": Function,
            "save": Function,
            "query": Function,
            "remove": Function,
            "delete": Function,
            "update": Function,
            "modifiedPath": String
        });
    });

    it("should override $resource's query", function(done) {

        // make "new" resource
        var testResource = bawResource("/test");

        var pass;
        var result = testResource
            .query().$promise
            .then(function() {
                pass = true;
            }, function() {
                pass = false;
            });
        $httpBackend.flush();

        expect(result).toBeDefined();
        expect(pass).toBeTrue();

        done();
    });
});