//angular
//    .module("angularDefineHack")
//    .provider(
//    "angularDefineHack",
//    [
//        "$window",
//        function ($window) {
//
//            $window.define = function angularDefineHack(name, deps, callback) {
//
//                if()
//
//
//            };
//
//            $window.define.amd = {};
//        }
//    ]);

angular.module("bawApp.services.core", [
    "angularDefineHack",
    "bawApp.services.core.lodash",
    "bawApp.services.core.moment",

]);