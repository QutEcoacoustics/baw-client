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
        "paging", "sorting"
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
        expect(q instanceof RootQuery).toBeTrue();
    });

    it("should implement the expected interface", function () {
        var queryInterface = validCombinators.concat(validOperators);
        var rootInterface = queryInterface.concat(rootOperators);

        var query = new Query();
        var expected = {};
        queryInterface.forEach(function (value) {
            expected[value] = undefined;
        });
        expect(query).toImplement(expected);

        var root = new RootQuery();
        expected = {};
        rootInterface.forEach(function (value) {
            expected[value] = undefined;
        });
        expect(root).toImplement(expected);
    });

    it("a query combinator should return itself", function () {
        var actual = q.and(q.eq("field", 3.0));

        expect(actual).toBe(q);
    });

    it("will throw if a combinator is passed a non-query object", function () {
        expect(function () {
            q.combinator("and", [{}]);
        }).toThrow("A combinator only accepts Query objects");
    });

    it("a query operator should return a new instance of a Query", function () {
        var actual = q.eq("field", 3.0);

        expect(actual instanceof Query).toBeTrue();
        expect(q instanceof RootQuery).toBeTrue();
        expect(actual instanceof RootQuery).toBeFalse();


        expect(actual).not.toBe(q);
    });


    it("should fail if a field is not set", function() {
        expect(function() {
            q.eq(3.0);
        }).toThrow();
    });

    it("should allow a new field to be set", function() {

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

        var actual = q.and(q.eq("field", 3.0));

        expect(actual.toJSON(spaces)).toBe(j(expected));
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

        var actual = q.eq("field", 3.0);

        expect(actual.toJSON(spaces)).toBe(j(expected));
    });

    it("should not allow more than one operation at root level", function() {

        expect(function () {
            var actual = q.eq("field", 3.0).eq("fieldB", 6.0);
        }).toThrow();
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
                }
            }
        };

        var actual = q.and(
            q.lt("fieldA", 3.0).contains("fieldB", "hello").gt("fieldA", 0.0)
        );
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

        var actual = q.and(
            q.lt("fieldA", 3.0).contains("fieldB", "hello"),
            q.gt("fieldA", 0.0)
        );
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

        var actual = q.and(
            q.lt("fieldA", 3.0).contains("fieldB", "hello"),
            q.gt("fieldA", 0.0),
            q.or(
                q.and(q.field("fieldA").notEq(6.0).lt(20.0)).lt("fieldB", 7.0),
                q.or(
                    q.lt("fieldA", 20.0),
                    q.gt("fieldB", 4.0)
                )
            )
        );
        expect(actual.toJSON(spaces)).toBe(j(expected));
    });


    it("should handle a very complex query", function() {
       var expected = {
           "filter": {
               "and": {
                   "site_id": {
                       "less_than": 123456,
                       "greater_than": 9876,
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
                       "greater_than_or_equal": 4567,
                       "contains": "contain text",
                       "starts_with": "starts with text",
                       "ends_with": "ends with text",
                       "range": {
                           "interval": "[123, 128]"
                       }
                   },
                   "or": {
                       "duration_seconds": {
                           "not_eq": 40
                       },
                       "not": {
                           "channels": {
                               "less_than_or_equal": 9999
                           }
                       }
                   }
               },
               "or": {
                   "recorded_date": {
                       "contains": "Hello"
                   },
                   "media_type": {
                       "ends_with": "world"
                   },
                   "duration_seconds": {
                       "eq": 60,
                       "lteq": 70,
                       "equal": 50,
                       "gteq": 80
                   },
                   "channels": {
                       "eq": 1,
                       "less_than_or_equal": 8888
                   }
               },
               "not": {
                   "duration_seconds": {
                       "not_eq": 140
                   }
               }
           }/*,
           "projection": {
               "include": [
                   "recorded_date",
                   "site_id",
                   "duration_seconds",
                   "media_type"
               ]
           },
           "sort": {
               "order_by": "duration_seconds",
               "direction": "desc"
           },
           "paging": {
               "page": 1,
               "items": 10
           }*/
       };

        var actual = q
            .and(
            q
                .lessThan("siteId", 123456)
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
        );

        expect(actual.toJSON(spaces)).toBe(j(expected));
    });
});