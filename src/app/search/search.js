angular.module("bawApp.search", [])

.controller("SearchesCtrl", ["$scope", "$resource", "Search",
function SearchesCtrl($scope, $resource, Search) {
//    $scope.sitesResource = $resource('/sites', {}, { get: { method:'GET', params:{}, isArray: true }});
//    $scope.sites = $scope.sitesResource.get();
}])

.controller("SearchCtrl", ["$scope", "$resource", "Search",

function SearchCtrl($scope, $resource, Search) {
//    $scope.sitesResource = $resource('/sites', {}, { get: { method:'GET', params:{}, isArray: true }});
//    $scope.sites = $scope.sitesResource.get();

    $scope.projects = [ {name: "demo", id: 6}, {name: "dddemo", id: 7}, {name: "ddaademo", id: 1}, {name: "desssdmo", id: 12}];
    $scope.selectedProjects = [$scope.projects[0].id];

    $scope.sites = [ {name: "fffff", id: 425}, {name: "ddddd", id: 587}, {name: "ssss", id: 374}, {name: "aaaaa", id: 175}];
    $scope.selectedSites= [$scope.sites[0].id];

    // $scope.tags = ...
    $scope.selectedTags =[];

    $scope.jobAnnotations = "Include";
    $scope.referenceAnnotations = "Include";

    $scope.startDate = undefined;
    $scope.endDate = undefined;

    // $scope.tags = ...
    // $scope.audioRecordings = ...
    $scope.selectedAudioRecordings =[];


}]);