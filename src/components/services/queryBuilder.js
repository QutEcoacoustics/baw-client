var qb = angular.module("bawApp.services.queryBuilder",  ["bawApp.configuration"]);

function Query() {

    this.filter = {};



    this.combinator = function combinator(type, functions) {
        if (!functions){
            return this;
        }

        this.filter[type] = new Query();

        var that = this.filter[type];
        functions.forEach(function(value, key) {
            if (!(value instanceof Query)){
                throw "A combinator only accepts Query objects";
            }

            that.filter[key] = value.filter;
        });

        return this;
    };

    this.operator = function operator(operation, field, value) {
        var that = this;
        if (this instanceof RootQuery) {
            that = new Query();
        }

        that.filter[field] = that.filter[field] || {};

        that.filter[field][operation] = value;

        return that;
    };

}

Query.mergeFilter = function mergeFilter(rootQuery, childQuery) {
    if (rootQuery instanceof Query && childQuery instanceof Query) {

    }
    else {
        throw "Query objects not passed in";
    }
};


Query.prototype.eq = function eq(field, value) {
    return this.operator("eq", field, value);
};

Query.prototype.and = function and() {
    var args = Array.prototype.slice.call(arguments, 0);
    return this.combinator("and", args);
};

Query.prototype.or = function or() {
    var args = Array.prototype.slice.call(arguments, 0);
    return this.combinator("or", args);
};


function RootQuery() {
    Query.call(this);

    this.sort = {};
    this.paging = {};

    this.toJSON = function toJSON(spaces) {
        return JSON.stringify({
            filter: this.filter

        }, null, spaces);
    };
}
RootQuery.prototype = Object.create(Query.prototype);





qb.factory("QueryBuilder", [function() {
    return {
        create: function() {
            return new RootQuery();
        }
    };
}]);