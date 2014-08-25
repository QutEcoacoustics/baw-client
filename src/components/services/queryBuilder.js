var qb = angular.module("bawApp.services.queryBuilder",  ["bawApp.configuration"]);

function Query() {

    this.filter = {};
    this.sort = {};
    this.paging = {};

    this.combinator = function combinator(type, arguments) {
        this.graph[type] = [];

        var that = this;
        arguments.forEach(function(value, key) {
            that.graph[key] = {};
            value.call(that.graph[key]);
        });

    };

    this.operator = function operator(operation, field, value) {
        this.graph[field] = this.graph[field] || {};

        this.graph[field][operation] = value;
    }

}


Query.prototype.eq = function eq(field, value) {
    this.operator("eq", field, value);
};

Query.prototype.and = function and(functions) {
    this.combinator("and", functions);
};

Query.prototype.or = function or(functions) {
    this.combinator("or", functions);
};

qb.factory("QueryBuilder", [function() {
    return {
        create: function() {
            return new Query();
        }
    }
}]);