var bawD3 = bawD3 || angular.module("bawApp.d3", []);
bawD3.controller('D3TestPageCtrl', ['$scope', 'conf.paths', '$http', function ($scope, paths, $http) {

    // use the REST API in here

    // assign the resulting data to scope (not great but it will do for now)
    $scope.basicData = [0, 1, 2, 3, 4, 5];

    $scope.siteId = 895;

    var request_filter = {
        "filter": {
            "site_id":{
                "eq":$scope.siteId
            }
        },
        "projection": {
            "include": ["id", "recorded_date", "duration_seconds"]
        }//,
        //"paging":{
        //    "page":2,
        //    "items":30
        //}
    };

    $http.post(paths.api.routes.audioRecording.filterAbsolute, request_filter)
        .success(function (data, status, headers, config) {

            $scope.filteredAudioRecordings = data;
        })
        .error(function (data, status, headers, config) {
            $scope.filteredAudioRecordings = data;
            console.warn('Filtered audio recordings failed.', data, status, headers, config);
        });


}]);