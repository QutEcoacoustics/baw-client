var bawD3 = bawD3 || angular.module("bawApp.d3", []);
bawD3.controller('D3TestPageCtrl', ['$scope', 'conf.paths', '$http', '$routeParams', 'Site', '$location',
    function ($scope, paths, $http, $routeParams, Site, $location) {

        // use the REST API in here
        // assign the resulting data to scope (not great but it will do for now)

        // get the site id (from route params or a default)
        $scope.siteId = $routeParams.siteId ? $routeParams.siteId : 398;

        // set up the $scope.siteId watcher after getting query string, so the location isn't changed.
        // subsequent changes will change the url
        $scope.$watch(function () {
            return $scope.currentSiteInfo;
        }, function (newValue, oldValue) {
            if(newValue && oldValue && newValue.id != oldValue.id){
                //console.log(newValue, oldValue);
                window.location = '/d3Test?siteId='+newValue.id;
            }
        });

        // populate select with options
        Site.getAllSites().then(function(result){
            $scope.sites = result.data.data;
            console.log('success', arguments);
        }, function(error){
            console.log('error', arguments);
        }, function(){
            console.log('notify', arguments);
        });

        //  get the selected site details
        Site.get({siteId: $scope.siteId}, {}, function getSiteSuccess(value) {

            value.links = value.projectIds.map(function (id) {
                return paths.api.routes.site.nestedAbsolute.format({"siteId": value.id, "projectId": id});
            });

            $scope.currentSiteInfo = value;
        }, function getSiteError() {
            console.log("retrieval of site json failed");
        });

        // get audio recording info for the current site
        var request_filter = {
            "filter": {
                "site_id": {
                    "eq": $scope.siteId
                }
            },
            "projection": {
                "include": ["id", "recorded_date", "duration_seconds", "site_id"]
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