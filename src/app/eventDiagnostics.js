//http://plnkr.co/edit/cn3MZynbpTYIcKUWmsBi?p=preview
angular
    .module("bawApp.diagnostics", []);
    // .config(["$provide", function($provide) {
    //     $provide.decorator("$rootScope", ["$delegate", function($delegate) {
    //         var scope = $delegate.constructor;
    //         var origBroadcast = scope.prototype.$broadcast;
    //         var origEmit = scope.prototype.$emit;
    //
    //         scope.prototype.$broadcast = function() {
    //             console.debug("$broadcast was called on $scope " + scope.$id + " with arguments:",
    //                 arguments);
    //             return origBroadcast.apply(this, arguments);
    //         };
    //         scope.prototype.$emit = function() {
    //             console.debug("$emit was called on $scope " + scope.$id + " with arguments:",
    //                 arguments);
    //             return origEmit.apply(this, arguments);
    //         };
    //         return $delegate;
    //     }]);
    // }]);