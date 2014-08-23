/**
 * A d3 Calendar View directive
 * Created by Anthony on 23/08/2014.
 */
angular.module("bawApp.d3.calendarView", ["bawApp.d3"])
    .directive("bawCalendarView", ["d3", function(d3) {
        return {
            restrict: "EA",
            scope: {
                data: "="
            },
            templateUrl: "d3Bindings/caelndarView/calenderViewTemplate.tpl.html",
            link: function($scope, $element, attributes, controller, transcludeFunction) {
                // use this function to bind DOM events to angular scope
                // or d3 events to angular scope.
                // you can use the jQuery / d3 objects here (use the injected d3 instance)

                // where possible avoid jQuery
                var element = $element[0];

                // d3.doSomething
            },
            controller: "bawCalendarViewController"
        }
    }])
    .controller("bawCalendarViewController", ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
        // The controller should host functionality native to angular
        // e.g.
        // - functions for button clicks
        // - API calls (not relevant in this case)
        // - scope modification
        // - iteraction with other services/providers
        // IT SHOULD NOT contain any reference to the d3 or jQuery objects

        $scope.example = "Hello world!";

    }]);