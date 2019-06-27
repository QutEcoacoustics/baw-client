class CitizenScienceAboutController {
    constructor($scope,
                $url,
                paths,
                backgroundImage,
                $routeParams) {

        $scope.listenLink =  $url.formatUri(paths.site.ngRoutes.citizenScience.listen,
            {studyName: $routeParams.studyName});

        $scope.study = $routeParams.studyName;

        var backgroundFiles = {
            "bristlebird": "2.jpg",
            "koala-verification": "3.jpg"
        };
        var backgroundFile = backgroundFiles.hasOwnProperty($routeParams.studyName) ? backgroundFiles[$routeParams.studyName] : "1.jpg";


        backgroundImage.currentBackground = paths.site.assets.backgrounds.citizenScience + backgroundFile;
    }
}

angular
    .module("bawApp.citizenScience", [
        "bawApp.citizenScience.listen",
        "bawApp.citizenScience.responses",
        "bawApp.components.background"
    ])
    .controller(
        "CitizenScienceController",
        [
            "$scope",
            function CitizenScienceController($scope) {

            }])
    .controller(
        "CitizenScienceAboutController",
        [
            "$scope",
            "$url",
            "conf.paths",
            "backgroundImage",
            "$routeParams",
            CitizenScienceAboutController
        ]);