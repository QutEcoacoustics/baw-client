describe("The QueryBuilder", function () {

    var queryBuilder, q;

    var spaces = 2;
    function j(obj) {
        JSON.stringify(obj, null, spaces);
    }

    beforeEach(module("bawApp.services.queryBuilder"));

    beforeEach(inject(["QueryBuilder", function (QueryBuilder) {
        queryBuilder = QueryBuilder;
        q = queryBuilder.create();

    }]));


    it("should be able to be created", function() {
        var q = queryBuilder.create();

        expect(q instanceof RootQuery).toBeTrue();
    });

    it("a query combinator should return itself", function() {
       var actual = q.and(q.eq("field", 3.0));

        expect(actual).toBe(q);
    });

    it("will throw if a combinator is passed a non-query object", function() {
        expect(function() {
            q.combinator("and", [{}]);
        }).toThrow("A combinator only accepts Query objects");
    });

    it("a query operator should return a new instance of a Query", function() {
        var actual = q.eq("field", 3.0);

        expect(actual instanceof Query).toBeTrue();
        expect(q instanceof RootQuery).toBeTrue();
        expect(actual instanceof RootQuery).toBeFalse();


        expect(actual).not.toBe(q);
    });

    it("should be able to do basic equality", function() {
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




//    var actual = q.and(
//        q.eq("fieldA", 3.0),
//        q.or(
//            q.lt("fieldA", 30.0).ge("fieldB", 0.0)
//        )
//    );
});