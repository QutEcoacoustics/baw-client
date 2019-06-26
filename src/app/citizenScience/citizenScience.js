class CitizenScienceAboutController {
    constructor($scope,
                $url,
                paths,
                backgroundImage,
                $routeParams) {

        $scope.listenLink =  $url.formatUri(paths.site.ngRoutes.citizenScience.listen,
            {studyName: $routeParams.studyName});

        $scope.study = $routeParams.studyName;

        // todo: random background image or background image slideshow (but from dataset ... how?)
        //backgroundImage.currentBackground = paths.site.assets.backgrounds.citizenScience;
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