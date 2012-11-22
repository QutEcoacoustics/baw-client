
/**
 * String format function
 * http://www.isurinder.com/blog/post/2011/04/02/StringFormat-In-JavaScript.aspx#.UKWRyvgzpQs
 * @type {Function}
 */
String.format = String.prototype.format = function() {
    var i=0;
    var string = (typeof(this) == "function" && !(i++)) ? arguments[0] : this;

    for (; i < arguments.length; i++)
        string = string.replace(/\{\d+?\}/, arguments[i]);

    return string;
};

/**
 * Chainable if statement
 * @param test - the test that is evaluated
 * @param {Function} truthyAction - the function to run if the test is truthy
 * @param {Function} falseyAction - the function to run if the test id falsey
 * @returns {Object} returns 'this'
 */
function fluidIf(test, truthyAction, falseyAction){
    if (test) {
        return truthyAction.call(this) || this;
    }

    if (falseyAction) {
        return falseyAction.call(this) || this;
    }

    return this;
};