angular
    .module("bawApp.services.queryBuilder", ["bawApp.configuration", "bawApp.vendorServices"])
    .factory(
        "QueryBuilder",
        [
            "conf.constants",
            "lodash",
            function (constants, _) {

                var validCombinators = {
                    "and": undefined,
                    "or": undefined,
                    "not": function (args) {
                        if (args.length > 1) {
                            throw "Not combinator only accepts one argument (either combinator or operator)";
                        }
                    }
                };

                var inCheck = function (field, value) {
                    var unique;
                    if (value instanceof Set) {
                        unique = Array.from(value);
                    } else if (!angular.isArray(value)) {
                        throw new Error("The in function must be given as an array");
                    }
                    else {
                        unique = _.uniq(value);
                    }

                    return {value: unique};
                };

                function nullOrUndefined(value) {
                    if (value === "" || value === null || value === undefined) {
                        return undefined;
                    }

                    return Number(value);
                }

                var intervalRegex = /^(\[|\()([\w\d\.]*?),(?!\s)([\w\d\.]*?)(\)|\])$/;
                var inRangeCheck = function (field, value, rangeWrapperHack) {
                    var range = rangeWrapperHack || {};

                    if (typeof value === "string") {
                        var matches = value.match(intervalRegex);
                        if (!matches) {
                            throw new Error("The interval string is incorrect");
                        }

                        range.lowerInclusive = matches[1] === "[";
                        range.lower = nullOrUndefined(matches[2]);
                        range.upper = nullOrUndefined(matches[3]);
                        range.upperInclusive = matches[4] === "]";

                        return checkRange({interval: value});
                    }
                    else if (value instanceof Object) {
                        range.lower = nullOrUndefined(value.from);
                        range.upper = nullOrUndefined(value.to);
                        range.lowerInclusive = true;
                        range.upperInclusive = false;

                        return checkRange({from: range.lower, to: range.upper});
                    }
                    else {
                        throw new Error("A value argument must be supplied to a range function");
                    }

                    function checkRange(value) {
                        if (Number.isNaN(range.lower) || Number.isNaN(range.upper)) {
                            throw new Error("An interval bound was NaN");
                        }

                        if (range.lower !== undefined && range.upper !== undefined && range.lower > range.upper) {
                            throw new Error("The lower bound on an interval must be less than or equal to the upper bound");
                        }

                        if (range.lower === undefined && range.upper === undefined) {
                            // indicates the operator should not be added
                            return true;
                        }

                        return {value};
                    }
                };

                var smartRange = function (field, value) {
                    var rangeArguments = {};

                    if (value.hasOwnProperty("interval")) {
                        let keyCount = Object.keys(value).length;
                        if (keyCount !== 1) {
                            throw new Error("Range arguments with an interval property cannot have any other properties");
                        }
                        value = value.interval;
                    }

                    var result = inRangeCheck(field, value, rangeArguments);

                    var lowerGiven = rangeArguments.lower !== undefined,
                        upperGiven = rangeArguments.upper !== undefined;
                    if (lowerGiven && upperGiven) {
                        return result;
                    }

                    if (lowerGiven) {
                        result.value = rangeArguments.lower;
                        result.operator = rangeArguments.lowerInclusive ? "gteq" : "gt";
                    }
                    else if (upperGiven) {
                        result.value = rangeArguments.upper;
                        result.operator = rangeArguments.upperInclusive ? "lteq" : "lt";
                    }

                    return result;
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
                    "range": smartRange,
                    "inRange": inRangeCheck,
                    "notInRange": inRangeCheck,
                    "in": inCheck,
                    "notIn": inCheck,
                    "contains": undefined,
                    "notContains": undefined,
                    "startsWith": undefined,
                    "notStartsWith": undefined,
                    "endsWith": undefined,
                    "notEndsWith": undefined,
                    "regex": function (field, value) {
                        throw new Error("The regex function is not supported");
                    }
                };

                function Query(currentFieldKey, rootQuery) {
                    var currentField = currentFieldKey,
                        self = this;
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
                        delete this.root.paging.disablePaging;

                        return this;
                    };

                    this.page.disable = function () {
                        delete self.root.paging.items;
                        delete self.root.paging.page;

                        self.root.paging.disablePaging = true;

                        return self;
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
                        var operator = operatorKey;

                        if (arguments.length === 1) {
                            value = field;
                            field = undefined;
                        }

                        var validator = validOperators[operator];
                        if (validator) {
                            var modified = validator.call(this, field, value);

                            if (!modified) {
                                // no-op
                            }
                            else if (modified === true) {
                                // do no work, cancel the operation
                                return this;
                            }

                            if (modified) {
                                // the validator has updated the operation
                                operator = modified.operator || operator;
                                field = modified.field || field;
                                value = modified.value || value;
                            }
                        }

                        return this.operator(operator, value, field);
                    };
                });

                const rootLevelFields = {
                    "filter": "filter",
                    "paging": "page",
                    "projection": "project",
                    "sorting": "sort"
                };

                function filterToQueryString(filterObject) {
                    var results = [];
                    for(let [key, value] of Object.entries(filterObject)) {
                        if (!validCombinators.hasOwnProperty(key)) {
                            if (value.hasOwnProperty("eq")) {
                                results.push(["filter_" + key, value.eq]);
                                continue;
                            } else if (value.hasOwnProperty("equal")) {
                                results.push(["filter_" + key, value.equal]);
                                continue;
                            }
                        }

                        throw new Error(`Cannot use the ${key} operator in a query string query`);
                    }

                    return results;
                }

                const queryStringWhiteList = {
                    filter: filterToQueryString,
                    paging: (pagingObject) => Object.entries(pagingObject),
                    projection: (projectionObject) => Object.entries(projectionObject).map(([k,v]) => ["projection_" + k, v.join(",")]),
                    sorting: (sortObject) => Object.entries(sortObject)
                };

                function RootQuery() {
                    Query.call(this, undefined, this);

                    this.paging = {};
                    this.projection = {};
                    this.sorting = {};


                    this.compose = function wrapAsRoot(query) {
                        return this.end.call(query);
                    };

                this.toJSON = function() {
                        var compiledQuery = {},
                            that = this;

                        Object.keys(rootLevelFields).forEach(function (value) {
                            if (Object.keys(that[value]).length > 0) {
                                compiledQuery[value] = that[value];
                            }
                        });

                    return compiledQuery;
                };

                this.toJSONString = function toJSON(spaces) {
                    return JSON.stringify(this.toJSON(), null, spaces);
                    };

                    this.toQueryString = function toQueryString() {
                        var that = this;

                        //transform
                        let kvps = Object.keys(rootLevelFields).reduce(function (previous, current) {
                            return previous.concat(queryStringWhiteList[current](that[current]));
                        }, []);

                        return _.fromPairs(kvps);
                    };
                }

                RootQuery.prototype = Object.create(Query.prototype);

                // iterate through all keys
                // if key matches operator or combinator, invoke based off key name
                function buildFromObject(query, node, field) {

                    // iterates over objects or arrays
                    for (let [key, value] of Object.entries(node)) {
                        // deal with root level functions
                        if (this instanceof RootQuery && rootLevelFields.hasOwnProperty(key)) {
                            if (key === "filter") {
                                // recurse
                                query = buildFromObject(query, node.filter);
                            }
                            else {
                                query = query[rootLevelFields[key]](value);
                            }
                            continue;
                        }

                        let valueIsObject = angular.isObject(value),
                            queryHasFunction = query[key] instanceof Function;

                        // check if current name is field name or a combinator
                        if (queryHasFunction && valueIsObject) {
                            let isCombinator = validCombinators.hasOwnProperty(key);
                            if (isCombinator) {
                                query = query[key](buildFromObject(query.root, value));
                                continue;
                            }
                        }

                        // otherwise if we are in a field object, apply operators
                        if (field) {
                            let isOperator = validOperators.hasOwnProperty(key);
                            if (isOperator) {
                                query = query[key](field, value);
                            }
                            else {
                                throw new Error(`Don't know how to apply operation ${ key }`);
                            }
                            continue;
                        }

                        // otherwise we must have found a field object, recurse into it and apply operations
                        if (!queryHasFunction && valueIsObject) {
                            query = buildFromObject(query, value, key);

                            continue;
                        }

                        throw new Error(`Recursion failed, non-object value (${ value }) given for key ${ key }`);
                    }

                    if (this instanceof RootQuery) {
                        return query.end();
                    }

                    return query;
                }

                RootQuery.prototype.fromJSON = function fromJSON(object) {
                    var query = new RootQuery();

                    buildFromObject.call(query, query, object);

                    return query;
                };

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

                /**
                 * Loads a plain object up and converts it a query
                 * @param object
                 */
                function load(object) {
                    return RootQuery.prototype.fromJSON(object);
                }

                return {
                    Query,
                    RootQuery,
                    create,
                    load
                };
            }]);