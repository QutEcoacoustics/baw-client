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

});