var qb = angular.module("bawApp.services.queryBuilder",  ["bawApp.configuration"]);
qb.factory("QueryBuilder", ["conf.constants", function(constants) {

    var validCombinators = {
        "and": undefined,
        "or": undefined,
        "not": function (args) {
            if (args.length > 1) {
                throw "Not combinator only accepts one argument (either combinator or operator)";
            }
        }
    };

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
        "in": function (field, value) {
            if (!angular.isArray(value)) {
                throw "The in function must be given as an array";
            }
        },
        "contains": undefined,
        "startsWith": undefined,
        "endsWith": undefined
    };

    function Query(currentFieldKey, rootQuery) {
        var currentField = currentFieldKey;
        this.root = rootQuery;

        this.filter = {};

        function newInstance(base, field) {
            var that = base;
            if (base instanceof RootQuery) {
                that = new Query(field || base.getField(), base);
            }
            return that;
        }

        function deepMergeFilter(base, child) {
            Object.keys(child).forEach(function (key) {
                if (angular.isObject(base[key])) {
                    deepMergeFilter(base[key], child[key]);
                }
                else {
                    base[key] = child[key];
                }
            });
        }

        this.combinator = function combinator(type, functions) {
            if (!functions) {
                return this;
            }

            // create a new level of nesting
            var that = newInstance(this);

            that.filter[type] = {};
            functions.forEach(function (value, key) {
                if (!(value instanceof Query)) {
                    throw "A combinator only accepts Query objects";
                }

                deepMergeFilter(that.filter[type], value.filter);
            });

            return that;
        };

        this.operator = function operator(operation, value, field) {
            var that = newInstance(this), operatorField = field;

            if (operatorField) {
                that.setField(operatorField);
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
            return newInstance(this, fieldKey);
        };

        this.setField = function setField(value) {
            currentField = value;
        };
        this.getField = function getField() {
            return currentField;
        };

        this.end = function returnRoot() {
            if (this instanceof Query) {
                // making an Query root-level
                // can only be done once - check
                // operator/combinator
                if (Object.keys(this.root.filter).length !== 0) {
                    throw new Error("A root level Query can only be defined once (do not call .end more than once).");
                }

                this.root.filter = this.filter;
                return this.root;
            }
            else {
                throw "A Query object must be passed in to returnRoot";
            }
        };

        this.page = function page(pageArguments) {
            if (!angular.isObject(pageArguments)) {
                throw new Error("The page function expects an object");
            }

            if (pageArguments.page === undefined) {
                pageArguments.page = constants.queryBuilder.defaultPage;
            }
            else if (!Math.isInt(pageArguments.page)) {
                throw new Error("paging.page must be an integer");
            }

            if (pageArguments.items === undefined) {
                pageArguments.items = constants.queryBuilder.defaultPageItems;
            }
            else if (!Math.isInt(pageArguments.items)) {
                throw new Error("paging.items must be an integer");
            }

            this.root.paging.items = pageArguments.items;
            this.root.paging.page = pageArguments.page;

            return this;
        };

        this.project = function projection(projectionArguments) {
            if (!angular.isObject(projectionArguments)) {
                throw new Error("The project function expects an object");
            }

            if (projectionArguments.exclude !== undefined && projectionArguments.include !== undefined) {
                throw new Error("A projection only supports include xor exclude");
            }

            var temp, key;
            if (projectionArguments.include) {
                temp = projectionArguments.include;
                key = "include";
            } else if (projectionArguments.exclude) {
                temp = projectionArguments.exclude;
                key = "exclude";
            }

            if (angular.isArray(temp) && temp.every(angular.isString)) {
                this.root.projection[key] = temp;
            }
            else {
                throw new Error("projection." + key + " must be an array of strings");
            }

            return this;
        };

        this.sort = function sort(sortArguments) {
            if (!angular.isObject(sortArguments)) {
                throw new Error("The sort function expects an object");
            }

            if ((sortArguments.orderBy === undefined) || !angular.isString(sortArguments.orderBy)) {
                throw new Error("sorting.orderBy must be provided and must be a string");
            }

            if (sortArguments.direction === undefined) {
                sortArguments.direction = constants.queryBuilder.defaultSortDirection;
            }
            else if (sortArguments.direction !== "asc" && sortArguments.direction !== "desc") {
                throw new Error("sort.direction must be 'asc' or 'desc'");
            }

            this.root.sorting.orderBy = sortArguments.orderBy;
            this.root.sorting.direction = sortArguments.direction;

            return this;
        };
    }

    Object.keys(validCombinators).forEach(function (combinatorKey) {
        Query.prototype[combinatorKey] = function () {
            var args = Array.prototype.slice.call(arguments, 0);

            var validator = validCombinators[combinatorKey];
            if (validator) {
                validator(arguments);
            }

            return this.combinator(combinatorKey, args);
        };
    });

    Object.keys(validOperators).forEach(function (operatorKey) {
        Query.prototype[operatorKey] = function (field, value) {
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
        Query.call(this, undefined, this);

        this.paging = {};
        this.projection = {};
        this.sorting = {};


        this.compose = function wrapAsRoot(query) {
            return this.end.call(query);
        };

        this.toJSON = function toJSON(spaces) {
            var compiledQuery = {},
                that = this;

            ["filter", "paging", "projection", "sorting"].forEach(function (value) {
                if (Object.keys(that[value]).length > 0) {
                    compiledQuery[value] = that[value];
                }
            });

            return JSON.stringify(compiledQuery, null, spaces);
        };
    }

    RootQuery.prototype = Object.create(Query.prototype);

    /**
     * @callback createCallback
     * @param {RootQuery} query
     * @returns {RootQuery}
     */

    /**
     * Create a new query.
     * Optional callback function automatically composes/ends the query.
     * @param {createCallback=} queryComposer
     * @returns {RootQuery}
     */
    function create(queryComposer) {
        var q = new RootQuery();

        if (queryComposer) {
            if (angular.isFunction(queryComposer)) {
                var result = queryComposer.call(q, q);

                if (!(result instanceof Query) || result.root !== q) {
                    throw new Error("The create callback must return a child instance of Query passed to the callback");
                }

                q.compose(result);
            }
            else {
                throw new Error("The create callback must be a function");
            }
        }

        return q;
    }

    return {
        Query: Query,
        RootQuery: RootQuery,
        create: create
    };
}]);