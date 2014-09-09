describe("The QueryBuilder", function () {

    var queryBuilder, q;

    var validCombinators = ["and", "or", "not"];
    var validOperators = [
        "equal", "eq", "notEqual", "notEq",
        "lessThan", "lt", "lessThanOrEqual", "lteq",
        "greaterThan", "gt", "greaterThanOrEqual", "gteq",
        "range", "in", "contains", "startsWith", "endsWith"
    ];
    var rootOperators = [
        "page", "sort", "project"
    ];

    var spaces = 2;

    function j(obj) {
        return JSON.stringify(obj, null, spaces);
    }

    beforeEach(module("bawApp.services.queryBuilder"));

    beforeEach(inject(["QueryBuilder", function (QueryBuilder) {
        queryBuilder = QueryBuilder;
        q = queryBuilder.create();

    }]));


    it("should be able to be created", function () {
        var q = queryBuilder.create();
        expect(q instanceof queryBuilder.RootQuery).toBeTrue();
    });

    it("should validate create's callback", function() {
        // should work without exception
        var q = queryBuilder.create();

        expect(Object.keys(q.filter).length).toBe(0);

        expect(function(){
            queryBuilder.create(1234);
        }).toThrowError(Error, "The create callback must be a function");

        expect(function() {
            queryBuilder.create(function() {});
        }).toThrowError(Error, "The create callback must return a child instance of Query passed to the callback");

        expect(function() {
            queryBuilder.create(function() {return queryBuilder.create();});
        }).toThrowError(Error, "The create callback must return a child instance of Query passed to the callback");
    });

    it("should implement the expected interface", function () {
        var queryInterface = validCombinators.concat(validOperators);
        var rootInterface = queryInterface.concat(rootOperators);

        var query = new queryBuilder.Query();
        var expected = {};
        queryInterface.forEach(function (value) {
            expected[value] = undefined;
        });
        expect(query).toImplement(expected);

        var root = new queryBuilder.RootQuery();
        expected = {};
        rootInterface.forEach(function (value) {
            expected[value] = undefined;
        });
        expect(root).toImplement(expected);
    });

    it("a query combinator should return a new instance of a Query", function () {
        var actual = q.and(q.eq("field", 3.0));

        expect(actual instanceof queryBuilder.Query).toBeTrue();
        expect(q instanceof queryBuilder.RootQuery).toBeTrue();
        expect(actual instanceof queryBuilder.RootQuery).toBeFalse();

        expect(actual).not.toBe(q);
    });

    it("will throw if a combinator is passed a non-query object", function () {
        expect(function () {
            q.combinator("and", [{}]);
        }).toThrow("A combinator only accepts Query objects");
    });

    it("a query operator should return a new instance of a Query", function () {
        var actual = q.eq("field", 3.0);

        expect(actual instanceof queryBuilder.Query).toBeTrue();
        expect(q instanceof queryBuilder.RootQuery).toBeTrue();
        expect(actual instanceof queryBuilder.RootQuery).toBeFalse();

        expect(actual).not.toBe(q);
    });


    it("should fail if a field is not set", function() {
        expect(function() {
            q.eq(3.0);
        }).toThrow();
    });

    it("should allow a new field to be set", function() {
        var newQ = q.field("test");

        expect(newQ.getField()).toBe("test");
        expect(q.getField()).toBe(undefined);
    });

    it("should allow a new field to be set with an operation", function() {
        var newQ = q.eq("test", 3.0);

        expect(newQ.getField()).toBe("test");
        expect(q.getField()).toBe(undefined);
    });

    it("should be able to produce a bare query", function() {
        var expected = {};

        expect(q.toJSON(spaces)).toBe(j(expected));
    });


    it("should be able to do basic equality", function () {
        var expected = {
            filter: {
                and: {
                    field: {
                        eq: 3.0
                    }
                }
            }
        };

        var actual = q.compose(q.and(q.eq("field", 3.0)));

        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should ensure .end and .compose and .create are the same", function() {
        var expected = {
            filter: {
                fieldA: {
                    eq: 3.0
                },
                or: {
                    fieldB: {
                        lt: 6.0,
                        gt: 3.0
                    }
                }
            }
        };

        var actualCompose = q.compose(q.eq("fieldA", 3.0).or(q.field("fieldB").lt(6.0).gt(3.0)));
        expect(actualCompose.toJSON(spaces)).toBe(j(expected));

        q = queryBuilder.create();
        var actualEnd = q.eq("fieldA", 3.0).or(q.field("fieldB").lt(6.0).gt(3.0)).end();
        expect(actualEnd.toJSON(spaces)).toBe(j(expected));

        var actualCreate = queryBuilder.create(function(q) {
            return q.eq("fieldA", 3.0).or(q.field("fieldB").lt(6.0).gt(3.0));
        });
        expect(actualCreate.toJSON(spaces)).toBe(j(expected));
    });

    it("should ensure not is arity:1 only", function () {
        expect(function () {
            q.not(q.field("fieldA").eq(3.0), q.field("fieldB").eq(4.0));
        }).toThrow("Not combinator only accepts one argument (either combinator or operator)");
    });

    it("should allow one operation at root level", function() {
        var expected = {
            filter: {
                field: {
                    eq: 3.0
                }
            }
        };

        var actual = q.compose(q.eq("field", 3.0));

        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should allow more than one operation at root level", function() {
        var expected = {
            filter: {
                fieldA: {
                    eq: 3.0
                },
                fieldB: {
                    eq: 6.0
                }
            }
        };

        var actual = q.compose(q.eq("fieldA", 3.0).eq("fieldB", 6.0));

        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should handle a more complex query", function () {
        var expected = {
            filter: {
                and: {
                    fieldA: {
                        lt: 3.0,
                        gt: 0.0
                    },
                    fieldB: {
                        contains: "hello"
                    }
                },
                fieldC: {
                    lt: 17
                }
            }
        };

        var actual = q.compose(q.and(
            q.lt("fieldA", 3.0).contains("fieldB", "hello").gt("fieldA", 0.0)
        ).lt("fieldC", 17));
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should handle a more complex query - with separate queries for the same field", function () {
        var expected = {
            filter: {
                and: {
                    fieldA: {
                        lt: 3.0,
                        gt: 0.0
                    },
                    fieldB: {
                        contains: "hello"
                    }
                }
            }
        };

        var actual = q.compose(q.and(
            q.lt("fieldA", 3.0).contains("fieldB", "hello"),
            q.gt("fieldA", 0.0)
        ));
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should handle a more complex query - with lots of nesting", function () {
        var expected = {
            filter: {
                and: {
                    fieldA: {
                        lt: 3.0,
                        gt: 0.0
                    },
                    fieldB: {
                        contains: "hello"
                    },
                    or: {
                        and: {
                            fieldA: {
                                notEq: 6.0,
                                lt: 20.0
                            }
                        },
                        fieldB: {
                            lt: 7.0
                        },
                        or: {
                            fieldA:{
                                lt: 20.0
                            },
                            fieldB: {
                                gt: 4.0
                            }
                        }
                    }
                }
            }
        };

        var actual = q.compose(q.and(
            q.lt("fieldA", 3.0).contains("fieldB", "hello"),
            q.gt("fieldA", 0.0),
            q.or(
                q.and(q.field("fieldA").notEq(6.0).lt(20.0)).lt("fieldB", 7.0),
                q.or(
                    q.lt("fieldA", 20.0),
                    q.gt("fieldB", 4.0)
                )
            )
        ));
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should allow paging to be set", function() {
        var expected = {
            paging: {
                items: 10,
                page: 30
            }
        };

        var actual = q.page({items: 10, page: 30});
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should validate page arguments", function() {
        expect(function(){
            q.page();
        }).toThrowError(Error, "The page function expects an object");

        expect(function(){
            q.page(null);
        }).toThrowError(Error, "The page function expects an object");

        expect(function(){
            q.page({page: "10fsfsfs"});
        }).toThrowError(Error, "paging.page must be an integer");

        expect(function(){
            q.page({items: "1sdssd0"});
        }).toThrowError(Error, "paging.items must be an integer");
    });

    it("should always update root with paging...even if on a subquery", function () {
        var expected = {
            filter: {
                fieldA: {
                    eq: 30
                }
            },
            paging: {
                items: 5,
                page: 2
            }
        };

        var actual = q.eq("fieldA", 30).page({items: 5, page: 2}).end();
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should allow sorting to be set", function() {
        var expected = {
            sorting: {
                orderBy: "durationSeconds",
                direction: "desc"
            }
        };

        var actual = q.sort({orderBy: "durationSeconds", direction: "desc"});
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should validate sorting arguments", function() {
        expect(function(){
            q.sort();
        }).toThrowError(Error, "The sort function expects an object");

        expect(function(){
            q.sort(null);
        }).toThrowError(Error, "The sort function expects an object");

        expect(function(){
            q.sort({orderBy: 10});
        }).toThrowError(Error, "sorting.orderBy must be provided and must be a string");

        expect(function(){
            q.sort({orderBy: undefined});
        }).toThrowError(Error, "sorting.orderBy must be provided and must be a string");

        expect(function(){
            q.sort({orderBy: "", direction: "10"});
        }).toThrowError(Error, "sort.direction must be 'asc' or 'desc'");
    });

    it("should always update root with sorting...even if on a subquery", function () {
        var expected = {
            filter: {
                fieldB: {
                    lt: 6.0
                }
            },
            sorting: {
                orderBy: "durationSeconds",
                direction: "asc"
            }
        };

        var actual = q.lt("fieldB", 6.0).sort({orderBy: "durationSeconds"}).end();
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should allow projection to be set (whitelist)", function() {
        var expected = {
            projection: {
                include: [
                    "durationSeconds", "id"
                ]
            }
        };

        var actual = q.project({include: ["durationSeconds", "id"]});
        expect(actual.toJSON(spaces)).toBe(j(expected));

    });

    it("should allow projection to be set (blacklist)", function() {
        var expected = {
            projection: {
                exclude: [
                    "durationSeconds", "id"
                ]
            }
        };
        var actual = q.project({exclude: ["durationSeconds", "id"]});
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should validate projection arguments", function() {

        expect(function(){
            q.project();
        }).toThrowError(Error, "The project function expects an object");

        expect(function(){
            q.project(null);
        }).toThrowError(Error, "The project function expects an object");

        expect(function(){
            q.project({include: {}});
        }).toThrowError(Error, "projection.include must be an array of strings");

        expect(function(){
            q.project({exclude: 123});
        }).toThrowError(Error, "projection.exclude must be an array of strings");

        expect(function(){
            q.project({include: [""], exclude: [""]});
        }).toThrowError(Error, "A projection only supports include xor exclude");
    });

    it("should always update root with projection...even if on a subquery", function () {
        var expected = {
            filter: {
                fieldC: {
                    notEq: 7.5
                }
            },
            projection: {
                include: ["durationSeconds", "fieldC"]
            }
        };

        var actual = q.notEq("fieldC", 7.5).project({include: ["durationSeconds", "fieldC"]}).end();
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });


    it("should handle a very complex query", function() {
       var expected = {
           "filter": {
               "and": {
                   "siteId": {
                       "lessThan": 123456,
                       "greaterThan": 9876,
                       "in": [
                           1,
                           2,
                           3
                       ],
                       "range": {
                           "from": 100,
                           "to": 200
                       }
                   },
                   "status": {
                       "greaterThanOrEqual": 4567,
                       "contains": "contain text",
                       "startsWith": "starts with text",
                       "endsWith": "ends with text",
                       "range": {
                           "interval": "[123, 128]"
                       }
                   },
                   "or": {
                       "durationSeconds": {
                           "notEq": 40
                       },
                       "not": {
                           "channels": {
                               "lessThanOrEqual": 9999
                           }
                       }
                   }
               },
               "or": {
                   "recordedDate": {
                       "contains": "Hello"
                   },
                   "mediaType": {
                       "endsWith": "world"
                   },
                   "durationSeconds": {
                       "eq": 60,
                       "lteq": 70,
                       "equal": 50,
                       "gteq": 80
                   },
                   "channels": {
                       "eq": 1,
                       "lessThanOrEqual": 8888
                   }
               },
               "not": {
                   "durationSeconds": {
                       "notEq": 140
                   }
               }
           }/*,
           "projection": {
               "include": [
                   "recordedDate",
                   "siteId",
                   "durationSeconds",
                   "mediaType"
               ]
           },
           "sort": {
               "orderBy": "duration_seconds",
               "direction": "desc"
           },
           "paging": {
               "page": 1,
               "items": 10
           }*/
       };

        var actual = q.and(
            q.lessThan("siteId", 123456)
                .greaterThan(9876)
                .in([1,2,3])
                .range({from: 100, to: 200}),
            q.field("status")
                .greaterThanOrEqual(4567)
                .contains("contain text")
                .startsWith("starts with text")
                .endsWith("ends with text")
                .range({interval: "[123, 128]"}),
            q.or(
                q.notEq("durationSeconds", 40),
                q.not (
                    q.lessThanOrEqual("channels", 9999)
                )
            )
        ).or(
            q.contains("recordedDate", "Hello"),
            q.endsWith("mediaType", "world"),
            q.field("durationSeconds")
                .eq(60)
                .lteq(70)
                .equal(50)
                .gteq(80),
            q.eq("channels", 1).lessThanOrEqual(8888)
        ).not(
            q.notEq("durationSeconds", 140)
        ).end();

        expect(actual.toJSON(spaces)).toBe(j(expected));
    });
});