describe('AppCtrl', function() {

    it('should pass a dummy test', function() {
       expect(true).toBeTruthy();
    });

    it("checks bowser is on the global scope", function() {
        expect(window.bowser).toBeDefined();
    });
});