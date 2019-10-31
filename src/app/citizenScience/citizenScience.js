class CitizenScienceAboutController {
    constructor($scope,
                $url,
                paths,
                backgroundImage,
                $routeParams,
                $http,
                $sce) {

        $scope.listenLink =  $url.formatUri(paths.site.ngRoutes.citizenScience.listen,
            {studyName: $routeParams.studyName});

        $scope.study = $routeParams.studyName;

        $http.get(paths.site.assets.citizenScience.landing + "backgrounds.json").then(response => {
            var backgroundFiles = response.data;
            var backgroundFile = backgroundFiles.hasOwnProperty($routeParams.studyName) ? backgroundFiles[$routeParams.studyName] : "1.jpg";
            backgroundImage.currentBackground = paths.site.assets.citizenScience.backgrounds.files + backgroundFile;
        });

        $http.get(paths.site.assets.citizenScience.landing + $scope.study + ".html").then(response => {
            $scope.content = $sce.trustAsHtml(response.data);
        }, response => {

            // convert e.g. my-study to My Study
            var heading = $scope.study.replace(/-/, " ")
                .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

            $scope.content = `<h2>${heading}</h2>` +
                "<p>Indicate whether the audio clips contain any of the given labels.</p>";
        });

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
            "$http",
            "$sce",
            CitizenScienceAboutController
        ]);