angular.module("bawApp.error", [])
    .controller("ErrorController", [
        "$scope",
        function ErrorController($scope) {
            $scope.message = "We can't seem to find what you are looking for (404)";
        }
    ]);
