describe("The url service", function () {

    var $url;

    beforeEach(module('url'));

    beforeEach(inject(["$url", function (providedUrl) {
        $url = providedUrl;
    }]));

    it("returns an object", function () {
        expect($url).toBeObject();
    });

    var myQuery = {
        blah: '1',
        tornado: "attack",
        something: null,
        hello: true,
        bye: false,
        'chocolate-chips': 'ring-ring',
        monkeys: 'dancing dancing',
        imNotHere: undefined,
        imEmpty: ''
    };

    it("encodes a querystring", function(){
        var result = $url.toKeyValue(myQuery);
        expect(result).toBe('blah=1&tornado=attack&something=&hello&bye=false&chocolate-chips=ring-ring&monkeys=dancing%20dancing&imNotHere=&imEmpty=');
    });

    it("encodes a querystring without empty values", function(){
        var result = $url.toKeyValue(myQuery, true);
        expect(result).toBe('blah=1&tornado=attack&hello&chocolate-chips=ring-ring&monkeys=dancing%20dancing');
    });


    describe("formatUri", function() {

        it("will format a templated uri", function() {
            var uri = "{protocol}://www.google.com";
            var values = {protocol: "http"};

            var expected = "http://www.google.com";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });


        it("will format a templated uri, encoding unmatched placeholders", function() {
            var uri = "{protocol}://www.google.com{path}";
            var values = {protocol: "http"};

            var expected = "http://www.google.com%7Bpath%7D";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });

        it("will format a templated uri, inserting placeholders and then add a query string with remaining values", function() {
            var uri = "{protocol}://www.google.com";
            var values = {protocol: "http", page: 1, query: "hello"};

            var expected = "http://www.google.com?page=1&query=hello";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });

        it("will format a templated uri, removing empty values", function() {
            var uri = "{protocol}://www.google.com";
            var values = {protocol: "http", page: 1, query: "hello", shouldNotBeHere: null, norI: "", orI: undefined};

            var expected = "http://www.google.com?page=1&query=hello";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });

    });

});