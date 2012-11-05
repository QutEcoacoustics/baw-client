'use strict'


function ProjectCtrl($scope, $http) {

    $http.get('projects.json').success(function(data) {
        $scope.projectList  = data;
    });



    $scope.ProjectName = "boobs r us";


}
