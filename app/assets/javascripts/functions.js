/*

 http://www.isurinder.com/blog/post/2011/04/02/StringFormat-In-JavaScript.aspx#.UKWRyvgzpQs

 */

String.format = String.prototype.format = function() {
    var i=0;
    var string = (typeof(this) == "function" && !(i++)) ? arguments[0] : this;

    for (; i < arguments.length; i++)
        string = string.replace(/\{\d+?\}/, arguments[i]);

    return string;
}