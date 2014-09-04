var qb = angular.module("bawApp.services.queryBuilder",  ["bawApp.configuration"]);

function Query(currentFieldKey) {
    var currentField = currentFieldKey;

    this.filter = {};

    this.combinator = function combinator(type, functions) {
        if (!functions){
            return this;
        }

        // create a new level of nesting IFF there is already a root combinator
        var that = this;
        if((this instanceof RootQuery) && (Object.keys(this.filter).length >= 1)) {
            that = new Query(this.getField());
        }

        that.filter[type] = {};

        functions.forEach(function(value, key) {
            if (!(value instanceof Query)){
                throw "A combinator only accepts Query objects";
            }

            Query.deepMergeFilter(that.filter[type], value.filter);
        });

        return this;
    };

    this.operator = function operator(operation, value, field) {
        var that = this, operatorField = field;
        if (this instanceof RootQuery) {
            that = new Query(this.getField());
        }

        if (operatorField) {
            that.field(operatorField);
        }
        else {
            operatorField = that.getField();
        }

        if (!operatorField) {
            throw "A field is not set - using an operator does not make sense";
        }

        that.filter[operatorField] = that.filter[operatorField] || {};
        that.filter[operatorField][operation] = value;

        return that;
    };

    this.field = function field(fieldKey) {
        currentField = fieldKey;
        return this;
    };

    this.getField = function getField() {
        return currentField;
    };
}

Query.deepMergeFilter = function mergeFilter(base, child) {
    Object.keys(child).forEach(function (key, index) {
        if (angular.isObject(base[key])) {
            Query.deepMergeFilter(base[key], child[key]);
        }
        else {
            base[key] = child[key];
        }
    });
};

var validCombinators = {
    "and": undefined,
    "or": undefined,
    "not": function(args) {
        if (args.length > 1) {
            throw "Not combinator only accepts one argument (either combinator or operator)";
        }
    }};

var validOperators = {
    "equal": undefined,
    "eq": undefined,
    "notEqual": undefined,
    "notEq": undefined,
    "lessThan": undefined,
    "lt": undefined,
    "lessThanOrEqual": undefined,
    "lteq": undefined,
    "greaterThan": undefined,
    "gt": undefined,
    "greaterThanOrEqual": undefined,
    "gteq": undefined,
    "range": undefined,
    "in": function(field, value) {
        if (!angular.isArray(value)) {
            throw "The in function must be given as an array";
        }
    },
    "contains": undefined,
    "startsWith": undefined,
    "endsWith": undefined
};


Object.keys(validCombinators).forEach(function (combinatorKey) {
    Query.prototype[combinatorKey] = function() {
        var args = Array.prototype.slice.call(arguments, 0);

        var validator = validCombinators[combinatorKey];
        if (validator) {
            validator(arguments);
        }

        return this.combinator(combinatorKey, args);
    };
});

Object.keys(validOperators).forEach(function(operatorKey) {
    Query.prototype[operatorKey] = function(field, value) {
        if (arguments.length == 1) {
            value = field;
            field = undefined;
        }


        var validator = validOperators[operatorKey];
        if (validator) {
            validator(field, value);
        }

        return this.operator(operatorKey, value, field);
    };
});


function RootQuery() {
    Query.call(this);

    this.sorting = {};
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