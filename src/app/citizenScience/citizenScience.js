class CitizenScienceAboutController {
    constructor($scope,
                $url,
                paths,
                backgroundImage,
                $routeParams,
                $http,
                $sce,
                UserProfile,
                constants) {

        $scope.listenLink =  {
            url: $url.formatUri(paths.site.ngRoutes.citizenScience.listen,
                {studyName: $routeParams.studyName}),
            text: "Get Started!"
        };

        // If the user is not logged in, the get started button goes to the login page with a redirect to the listen page
        UserProfile.get.then(() => {
            let profile = UserProfile.profile;
            if (!profile.id) {
                let loginLink =  paths.api.links.loginActualAbsolute;
                let obj ={};
                obj[constants.rails.loginRedirectQsp] = $scope.listenLink.url;
                $scope.listenLink.url = $url.formatUri(loginLink, obj);
                $scope.listenLink.text = "Log in to get started!";
                $scope.listenLink.target = "_self";
            }
        });

        $scope.study = $routeParams.studyName;

        $http.get(paths.site.assets.citizenScience.landing + "backgrounds.json").then(response => {
            var backgroundFiles = response.data;
            var backgroundFile = backgroundFiles.hasOwnProperty($routeParams.studyName) ? backgroundFiles[$routeParams.studyName] : "1.jpg";
            backgroundImage.currentBackground = paths.site.assets.citizenScience.backgrounds.files + backgroundFile;
        });

        $http.get(paths.site.assets.citizenScience.landing + $scope.study + ".html").then(response => {
            $scope.content = $sce.trustAsHtml(response.data);
        }, response => {
            // Default if no custom html is loaded.
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
            "UserProfile",
            "conf.constants",
            CitizenScienceAboutController
        ]);