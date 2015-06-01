describe("The bawResource service", function () {

    var $httpBackend, bawResource, $rootScope;

    beforeEach(module('bawApp.services'));

    beforeEach(inject(["$injector", "bawResource", "$rootScope", "$http", function ($injector, providedBawResource, _$rootScope, $http) {
        $httpBackend = $injector.get('$httpBackend');
        $http.defaults.headers.common["Authorization"] = "SOME AUTH TOKEN";

        $httpBackend.when("GET", "/test").respond({data:[], meta:{}});

        bawResource = providedBawResource;
        $rootScope = _$rootScope;
    }]));


    it("should return a resource constructor that includes update/put", function () {

        expect(bawResource("/test")).toImplement({
            "get": null,
            "save": null,
            "query": null,
            "remove": null,
            "delete": null,
            "update": null,
            "modifiedPath": null
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

        expect(pass).toBeTrue();

        done();
    });
});