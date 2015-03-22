describe("The url service", function () {

    var $url, provider;

    beforeEach(module("url", function($urlProvider) {
        provider = $urlProvider;
    }));

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

    it("encodes a querystring", function () {
        var result = $url.toKeyValue(myQuery);
        expect(result).toBe('blah=1&tornado=attack&something=&hello&bye=false&chocolate-chips=ring-ring&monkeys=dancing%20dancing&imNotHere=&imEmpty=');
    });

    it("encodes a querystring without empty values", function () {
        var result = $url.toKeyValue(myQuery, true);
        expect(result).toBe('blah=1&tornado=attack&hello&chocolate-chips=ring-ring&monkeys=dancing%20dancing');
    });


    describe("formatUri", function () {

        it("will format a templated uri", function () {
            var uri = "{protocol}://www.google.com";
            var values = {protocol: "http"};

            var expected = "http://www.google.com";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });


        it("will format a templated uri, encoding unmatched placeholders", function () {
            var uri = "{protocol}://www.google.com{path}";
            var values = {protocol: "http"};

            var expected = "http://www.google.com%7Bpath%7D";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });

        it("will format a templated uri, inserting placeholders and then add a query string with remaining values",
           function () {
               var uri = "{protocol}://www.google.com";
               var values = {protocol: "http", page: 1, query: "hello"};

               var expected = "http://www.google.com?page=1&query=hello";
               var actual = $url.formatUri(uri, values);

               expect(actual).toBe(expected);

           });

        it("will format a templated uri, removing empty values", function () {
            var uri = "{protocol}://www.google.com";
            var values = {protocol: "http", page: 1, query: "hello", shouldNotBeHere: null, norI: "", orI: undefined};

            var expected = "http://www.google.com?page=1&query=hello";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });

        it("will correctly format uri that already has a partial querystring", function () {
            var uri = "http://www.google.com?qsp=hello";
            var values = {anotherQsp: "world", reallyAnother: 1};

            var expected = "http://www.google.com?qsp=hello&anotherQsp=world&reallyAnother=1";
            var actual = $url.formatUri(uri, values);

            expect(actual).toBe(expected);

        });


    });

    describe("Testing url configuration", function () {

        beforeEach(function() {
            provider.registerRenamer("Upper", function (key) {
                return key.toUpperCase();
            });
        });

        it("cannot override the default case renamer for tokens", function () {
            var uri = "http://google.com/test.html";
            var query = {helloWorld: "are you there?"};

            var result = $url.formatUri(uri, query);
            var expected = "http://google.com/test.html?helloWorld=are%20you%20there%3F";

            expect(result).toBe(expected);
        });

        it("creates a helper function that uses the specified case renamer for tokens", function () {
            var uri = "http://google.com/test.html";
            var query = {helloWorld: "are you there?"};

            var result = $url.formatUriUpper(uri, query);
            var expected = "http://google.com/test.html?HELLOWORLD=are%20you%20there%3F";

            expect(result).toBe(expected);
        });

        it("can be configured with a token renamer", function () {
            var uri = "http://google.com/test.html";
            var query = {helloWorld: "are you there?"};

            var result = $url.formatUri(uri, query, function(key) { return key;});
            var expected = "http://google.com/test.html?helloWorld=are%20you%20there%3F";

            expect(result).toBe(expected);
        });
    });
});