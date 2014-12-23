describe("The predictiveCache service", function () {

    var testProfile,
        $httpProvider;
    beforeEach(module("bawApp.services", function (_$httpProvider_) {
        $httpProvider = _$httpProvider_;
    }));

    beforeEach(function () {
        testProfile = {
            name: "Media cache ahead",
            match: /google\.com\?page=(.*)&size=(.*)/,
            request: [
                function (args, data) {
                    var a = args[0], b = args[1];
                    return "one " + a + " url" + b;
                },
                "another {0} url {1}"
            ],
            progression: [
                30.0,
                function (previous, data) {
                    var next = previous + 30.0;
                    if (data.responseData && next >= data.responseData.max) {
                        return;
                    }
                    else {
                        return next;
                    }
                }
            ],
            count: 10,
            method: "HEAD",
            progressive: false
        };
    });

    describe("The predictive cache http interceptor", function () {
        var predictiveCacheInterceptor, $httpBackend;

        beforeEach(inject(function (_predictiveCacheInterceptor_, $injector) {
            predictiveCacheInterceptor = _predictiveCacheInterceptor_;
            $httpBackend = $injector.get("$httpBackend");
        }));

        it("ensure the interceptor implements the expected methods", function () {
            expect(predictiveCacheInterceptor).toImplement({
                response: null,
                listeners: null
            });
        });

        it("requires the interceptor be registered!", function () {
            var index = $httpProvider.interceptors.indexOf("predictiveCacheInterceptor");
            expect(index >= 0).toBeTrue();
        });

        it("ensures the response interceptor calls the correct method on every listener when a request is made", function () {

            var listenerUrl = null, listenerDataSome = null;
            predictiveCacheInterceptor.listeners().push(function (response) {
                listenerUrl = response.config.url;
                listenerDataSome = response.data.some;
            });
            var listenerUrl2 = null, listenerDataSome2 = null;
            predictiveCacheInterceptor.listeners().push(function (response) {
                listenerUrl2 = response.config.url;
                listenerDataSome2 = response.data.some;
            });

            var mockHttpResponse = {
                config: {
                    url: "some fake url"
                },
                data: {
                    some: "data"
                }
            };

            predictiveCacheInterceptor.response(mockHttpResponse);

            expect(listenerUrl).toBe("some fake url");
            expect(listenerUrl2).toBe("some fake url");
            expect(listenerDataSome).toBe("data");
            expect(listenerDataSome2).toBe("data");
        });

        it("returns the response unmodified", inject(["$http", function ($http) {
            spyOn(predictiveCacheInterceptor, "response").and.callThrough();

            $httpBackend.expectGET("www.url.com").respond(200, {max: 30});

            var response;
            $http.get("www.url.com").success(function (d, s, h, c, st) {
                response = {
                    data: d,
                    status: s,
                    headers: h,
                    config: c,
                    statusText: st || ""
                };
            });
            $httpBackend.flush();

            expect(predictiveCacheInterceptor.response).toHaveBeenCalled();
            var interceptorInput = predictiveCacheInterceptor.response.calls.argsFor(0);

            var e = JSON.stringify(interceptorInput[0], undefined, 2),
                a = JSON.stringify(response, undefined, 2);

            expect(a).toBe(e);
        }]));
    });

    describe("The functionality of the cacher", function () {
        var configuredProfile,
            $http,
            exampleUrl = "http://www.google.com?page=1&size=10",
            httpEvents = [],
            predictiveCache;

        beforeEach(function () {
            module(function ($provide) {
                $provide.factory("unitTestInterceptor", function () {
                    return {
                        request: function (httpConfig) {
                            httpEvents.push("ENQUEUE: " + httpConfig.url);
                            return httpConfig;
                        },
                        response: function (response) {
                            httpEvents.push("COMPLETED: " + response.config.url);
                            return response;
                        }
                    };
                });

                $httpProvider.interceptors.push("unitTestInterceptor");
            });

            inject(function ($injector) {
                $httpBackend = $injector.get("$httpBackend");

                // create .when for requests common to all tests

                // grab a reference to $http
                $http = $injector.get("$http");

                // set up the cache service (register everything)
                predictiveCache = $injector.get("predictiveCache");
                configuredProfile = predictiveCache(testProfile);
            });

            httpEvents = [];
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation(false);
            $httpBackend.verifyNoOutstandingRequest();
        });

        function assertHttpEventsAreCorrect(expectedOrder) {
            expect(httpEvents.length).toBe(expectedOrder.length);

            httpEvents.forEach(function (actualEvent, index) {
                expect(actualEvent).toBe(expectedOrder[index]);
            });
        }

        it("makes the required requests when the url is matched", function () {
            var expectedUrls = [
                ["one 31 url40", "another 31 url 40"],
                ["one 61 url70", "another 61 url 70"],
                ["one 91 url100", "another 91 url 100"],
                ["one 121 url130", "another 121 url 130"],
                ["one 151 url160", "another 151 url 160"],
                ["one 181 url190", "another 181 url 190"],
                ["one 211 url220", "another 211 url 220"],
                ["one 241 url250", "another 241 url 250"],
                ["one 271 url280", "another 271 url 280"],
                ["one 301 url310", "another 301 url 310"]
            ];

            var expectedOrder = [
                "ENQUEUE: " + exampleUrl,
                "COMPLETED: " + exampleUrl,
                "ENQUEUE: one 31 url40",
                "ENQUEUE: another 31 url 40",
                "ENQUEUE: one 61 url70",
                "ENQUEUE: another 61 url 70",
                "ENQUEUE: one 91 url100",
                "ENQUEUE: another 91 url 100",
                "ENQUEUE: one 121 url130",
                "ENQUEUE: another 121 url 130",
                "ENQUEUE: one 151 url160",
                "ENQUEUE: another 151 url 160",
                "ENQUEUE: one 181 url190",
                "ENQUEUE: another 181 url 190",
                "ENQUEUE: one 211 url220",
                "ENQUEUE: another 211 url 220",
                "ENQUEUE: one 241 url250",
                "ENQUEUE: another 241 url 250",
                "ENQUEUE: one 271 url280",
                "ENQUEUE: another 271 url 280",
                "ENQUEUE: one 301 url310",
                "ENQUEUE: another 301 url 310",
                "COMPLETED: one 31 url40",
                "COMPLETED: another 31 url 40",
                "COMPLETED: one 61 url70",
                "COMPLETED: another 61 url 70",
                "COMPLETED: one 91 url100",
                "COMPLETED: another 91 url 100",
                "COMPLETED: one 121 url130",
                "COMPLETED: another 121 url 130",
                "COMPLETED: one 151 url160",
                "COMPLETED: another 151 url 160",
                "COMPLETED: one 181 url190",
                "COMPLETED: another 181 url 190",
                "COMPLETED: one 211 url220",
                "COMPLETED: another 211 url 220",
                "COMPLETED: one 241 url250",
                "COMPLETED: another 241 url 250",
                "COMPLETED: one 271 url280",
                "COMPLETED: another 271 url 280",
                "COMPLETED: one 301 url310",
                "COMPLETED: another 301 url 310"
            ];

            $httpBackend.expectGET(exampleUrl).respond(200);
            expectedUrls.forEach(function (pair) {
                $httpBackend.expectHEAD(pair[0]).respond(200);
                $httpBackend.expectHEAD(pair[1]).respond(200);
            });

            $http.get(exampleUrl);

            $httpBackend.flush();

            assertHttpEventsAreCorrect(expectedOrder);
        });

        it("correctly cancels an progression", function () {
            var expectedUrls = [
                ["one 31 url40", "another 31 url 40"],
                ["one 61 url70", "another 61 url 70"],
                ["one 91 url100", "another 91 url 100"]
            ];

            $httpBackend.expectGET(exampleUrl).respond(200, {max: 101});
            expectedUrls.forEach(function (pair) {
                $httpBackend.expectHEAD(pair[0]).respond(200);
                $httpBackend.expectHEAD(pair[1]).respond(200);
            });

            $http.get(exampleUrl);

            $httpBackend.flush();
        });

        it("correctly handles using match function", function () {
            testProfile.match = function (url) {
                if (/google\.com\?page=\d+&size=\d+/.test(url)) {
                    return [
                        /page=([\.\d]+)/.exec(url)[1],
                        /size=([\.\d]+)/.exec(url)[1]
                    ];
                }
                return null;
            };
            configuredProfile = predictiveCache(testProfile);
            var expectedUrls = [
                ["one 31 url40", "another 31 url 40"],
                ["one 61 url70", "another 61 url 70"],
                ["one 91 url100", "another 91 url 100"]
            ];

            $httpBackend.expectGET(exampleUrl).respond(200, {max: 101});
            expectedUrls.forEach(function (pair) {
                $httpBackend.expectHEAD(pair[0]).respond(200);
                $httpBackend.expectHEAD(pair[1]).respond(200);
            });

            $http.get(exampleUrl);

            $httpBackend.flush();
        });

        it("correctly fails when a match function does not confirm to the RegExp API", function () {
            testProfile.match = function (url) {
                return;
            };
            testProfile.progressions = [
                function() {},
                function() {}
            ];

            expect(function () {
                configuredProfile = predictiveCache(testProfile);
                $httpBackend.expectGET(exampleUrl).respond(200);
                $http.get(exampleUrl);

                $httpBackend.flush(1);
            }).toThrowError("The match function must conform to the RegExp.match API");
        });

        it("correctly batches requests as a series of chained promised when progressive===true", function () {
            testProfile.progressive = true;
            configuredProfile = predictiveCache(testProfile);
            var expectedUrls = [
                ["one 31 url40", "another 31 url 40"],
                ["one 61 url70", "another 61 url 70"],
                ["one 91 url100", "another 91 url 100"],
                ["one 121 url130", "another 121 url 130"],
                ["one 151 url160", "another 151 url 160"],
                ["one 181 url190", "another 181 url 190"],
                ["one 211 url220", "another 211 url 220"],
                ["one 241 url250", "another 241 url 250"],
                ["one 271 url280", "another 271 url 280"],
                ["one 301 url310", "another 301 url 310"]
            ];

            var expectedOrder = [
                "ENQUEUE: " + exampleUrl,
                "COMPLETED: " + exampleUrl,
                "ENQUEUE: one 31 url40", "ENQUEUE: another 31 url 40", "COMPLETED: one 31 url40", "COMPLETED: another 31 url 40",
                "ENQUEUE: one 61 url70", "ENQUEUE: another 61 url 70", "COMPLETED: one 61 url70", "COMPLETED: another 61 url 70",
                "ENQUEUE: one 91 url100", "ENQUEUE: another 91 url 100", "COMPLETED: one 91 url100", "COMPLETED: another 91 url 100",
                "ENQUEUE: one 121 url130", "ENQUEUE: another 121 url 130", "COMPLETED: one 121 url130", "COMPLETED: another 121 url 130",
                "ENQUEUE: one 151 url160", "ENQUEUE: another 151 url 160", "COMPLETED: one 151 url160", "COMPLETED: another 151 url 160",
                "ENQUEUE: one 181 url190", "ENQUEUE: another 181 url 190", "COMPLETED: one 181 url190", "COMPLETED: another 181 url 190",
                "ENQUEUE: one 211 url220", "ENQUEUE: another 211 url 220", "COMPLETED: one 211 url220", "COMPLETED: another 211 url 220",
                "ENQUEUE: one 241 url250", "ENQUEUE: another 241 url 250", "COMPLETED: one 241 url250", "COMPLETED: another 241 url 250",
                "ENQUEUE: one 271 url280", "ENQUEUE: another 271 url 280", "COMPLETED: one 271 url280", "COMPLETED: another 271 url 280",
                "ENQUEUE: one 301 url310", "ENQUEUE: another 301 url 310", "COMPLETED: one 301 url310", "COMPLETED: another 301 url 310"
            ];
            $httpBackend.expectGET(exampleUrl).respond(200);
            $http.get(exampleUrl);

            expectedUrls.forEach(function (pair, index) {
                // expect two requests at a time to be issued
                // two per progression
                // so expect only two every flush!
                //console.debug("expectations!", pair[0], pair[1]);
                $httpBackend.expectHEAD(pair[0]).respond(200);
                $httpBackend.expectHEAD(pair[1]).respond(200);
            });

            //console.debug("begin execution");
            //console.debug("flush!");

            // promise resolution means the next all the requests are processed in a single
            // flush whether we like it or not.
            $httpBackend.flush();
            //console.debug("flush done!");

            assertHttpEventsAreCorrect(expectedOrder);
        });

        it("handles negative/odd progressions", function () {
            testProfile.progression = [
                function (previous, data) {
                    return Math.pow(previous, 2) - Math.pow(5, 2);
                },
                -10
            ];
            testProfile.request = ["hello {0}    {1}"];
            configuredProfile = predictiveCache(testProfile);
            var expectedUrls = [
                ["hello -24    0"],
                ["hello 551    -10"],
                ["hello 303576    -20"],
                ["hello 92158387751    -30"],
                ["hello 8.493168432863667e+21    -40"],
                ["hello 7.213391002899188e+43    -50"],
                ["hello 5.203300976070695e+87    -60"],
                ["hello 2.7074341047578252e+175    -70"],
                ["hello Infinity    -80"],
                ["hello Infinity    -90"]
            ];

            $httpBackend.expectGET(exampleUrl).respond(200);
            expectedUrls.forEach(function (pair) {
                $httpBackend.expectHEAD(pair[0]).respond(200);
            });

            $http.get(exampleUrl);

            $httpBackend.flush();
        });
    });


    describe("Validating the input profile", function () {
        var predictiveCache;
        beforeEach(inject(function (_predictiveCache_) {
            predictiveCache = _predictiveCache_;
        }));


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

        it("will fail if the supplied match regular expression is not a RegExp or a function", function () {
            testProfile.match = function () {
            };
            var profile = predictiveCache(testProfile);

            testProfile.match = /test/;
            profile = predictiveCache(testProfile);

            testProfile.match = "test";
            expect(function () {
                predictiveCache(testProfile);
            }).toThrowError("The value for match must be a regular expression or a function");
        });

        it("ensures the request value is an array of strings or functions", function () {
            var failValues = [null, [], 33, [33]];

            failValues.forEach(function (item) {
                testProfile.request = item;

                expect(function () {
                    predictiveCache(testProfile);
                }).toThrowError("requests must be an array of strings or functions");
            });
        });

        [
            {key: "an array of strings", in: ["hello", "world"]},
            {key: "an array of strings and functions", in: [angular.noop, "hello world"]},
            {key: "an array of functions", in: [angular.noop, angular.noop]}
        ].forEach(function (requestTest) {
                it("allows the request value to be " + requestTest.key, function () {
                    testProfile.request = requestTest.in;

                    var profile = predictiveCache(testProfile);
                    expect(profile.request).toBe(requestTest.in);
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

        it("ensures the progressive option strictly accepts booleans", function () {
            testProfile.progressive = true;
            var profile = predictiveCache(testProfile);

            testProfile.progressive = false;
            profile = predictiveCache(testProfile);

            delete testProfile.progressive;
            profile = predictiveCache(testProfile);
            expect(profile.progressive).toBeTrue();

            [null, 0, "false", [], {}, [false]].forEach(function (errorValue) {
                expect(function () {
                    testProfile.progressive = errorValue;
                    predictiveCache(testProfile);
                }).toThrowError("progressive must be boolean");
            });
        });
    });
});