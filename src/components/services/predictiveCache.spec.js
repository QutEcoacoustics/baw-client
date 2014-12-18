describe("The predictiveCache service", function () {

    var predictiveCache,
        testProfile,
        $httpProvider;
    beforeEach(module("bawApp.services", function (_$httpProvider_) {
        $httpProvider = _$httpProvider_;

    }));

    beforeEach(inject(function (_predictiveCache_) {
        predictiveCache = _predictiveCache_;

        testProfile = {
            name: "Media cache ahead",
            match: /google\.com\?page=(.*)&size=(.*)/,
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

    }));

    describe("The predictive cache http interceptor", function () {
        var predictiveCacheInterceptor, $httpBackend;

        beforeEach(inject(function (_predictiveCacheInterceptor_, $injector) {
            predictiveCacheInterceptor = _predictiveCacheInterceptor_;
            $httpBackend = $injector.get("$httpBackend");
        }));

        it("ensure the interceptor implements the expected methods", function () {
            expect(predictiveCacheInterceptor).toImplement({
                request: null,
                listeners: null
            });
        });

        it("requires the interceptor be registered!", function () {
            var index = $httpProvider.interceptors.indexOf("predictiveCacheInterceptor");
            expect(index >= 0).toBeTrue();
        });

        it("ensures the request interceptor calls the correct method on every listener when a request is made", function () {
            predictiveCacheInterceptor.listeners().push();
            spyOn(predictiveCache, "interceptorCallback");

            var mockHttpConfig = {
                url: "some fake url"
            };

            predictiveCacheInterceptor.request(mockHttpConfig);

            expect(predictiveCache.interceptorCallback).toHaveBeenCalled();
            expect(predictiveCache.interceptorCallback).toHaveBeenCalledWith("some fake url");
        });

        it("returns the http config unmodified", inject(["$http", function ($http) {
            spyOn(predictiveCacheInterceptor, "request").and.callThrough();

            $httpBackend.expectGET("www.url.com").respond(200);
            var reqConfig;
            $http.get("www.url.com").success(function(d,s,h,c,st) {
                reqConfig = c;
            });
            $httpBackend.flush();

            expect(predictiveCacheInterceptor.request).toHaveBeenCalled();
            var interceptorInput = predictiveCacheInterceptor.request.calls.argsFor(0);

            var e = JSON.stringify(interceptorInput[0]),
                a = JSON.stringify(reqConfig);

            expect(a).toBe(e);
        }]));
    });

    describe("The functionality of the cacher", function () {
        var configuredProfile, $http,
            exampleUrl = "http://www.google.com?page=1&size=10";

        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get("$httpBackend");

            // create .when for requests common to all tests

            // grab a reference to $http
            $http = $injector.get("$http");

            // set up the cache service (register everything)
            configuredProfile = predictiveCache(testProfile);
        }));

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it("makes the required requests when the url is matched", function () {

            $httpBackend.expectGET(exampleUrl).respond(200);
            $httpBackend.expectHEAD("one url").respond(200);
            $httpBackend.expectHEAD("another url").respond(200);
            $http.get(exampleUrl);

            $httpBackend.flush();
        });
    });

    it("registers a new http interceptor when a profile is added", function () {
        var interceptorCount = $httpProvider.interceptors.length;

        var profile = predictiveCache(testProfile);

        expect($httpProvider.interceptors.length).toBe(interceptorCount + 1);
    });


    describe("Validating the input profile", function () {
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
            {
                key: "array of numbers or functions", in: [1, function (i) {
                return i;
            }]
            }
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

                    expect(function () {
                        var profile = predictiveCache(testProfile);
                    }).toThrowError("progression must be an array of numbers/functions");
                });
            });

        it("ensures count is a number", function () {
            var profile = predictiveCache(testProfile);
            expect(profile.count).toBe(testProfile.count);

            testProfile.count = "fkasnfiabfias";
            expect(function () {
                predictiveCache(testProfile);
            }).toThrowError("count must be a positive integer");

            testProfile.count = -1;
            expect(function () {
                predictiveCache(testProfile);
            }).toThrowError("count must be a positive integer");
        });

        it("allows a default value to be used for count", function () {
            delete testProfile.count;

            var profile = predictiveCache(testProfile);
            expect(profile.count).toBe(10);

        });
    });
});