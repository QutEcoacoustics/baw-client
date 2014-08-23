var bawD3 = bawD3 || angular.module("bawApp.d3", []);
bawD3.controller('D3TestPageCtrl', ['$scope', function($scope) {

        // use the REST API in here
        // assign the resulting data to scope (not great but it will do for now
        $scope.basicData = [0,1,2,3,4,5];

    }]);