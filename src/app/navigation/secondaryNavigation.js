angular
    .module("bawApp.navigation.secondaryNavigation", [])
    .controller("SecondaryNavigationController", [
        "$rootScope", "$location", "$route", "conf.paths",
        function ($rootScope, $location, $route, paths) {
            var self = this;

            const omnipresentLinks = [
                {
                    title: "Home",
                    href: paths.api.links.homeAbsolute
                },
                {
                    title: "Projects",
                    href: paths.api.links.projectsAbsolute
                }
            ];

            this.title = "";
            this.links = omnipresentLinks;

            $rootScope.$on("$routeChangeSuccess", function (event, current, previous, rejection) {
                self.title = current.$$route.title;

                let currentLink = {title: self.title, href: $location.$$path};
                let extraLinks = current.$$route.secondaryNavigation || [];

                self.links = omnipresentLinks
                    .concat(extraLinks)
                    .concat(currentLink)
                    .map(activePath.bind(null, current.$$route));
            });

            let activePath = function (route, link) {
                link.isActive = route.regexp.test(link.href);
                return link;
            };
        }])
    .component("leftNavBar", {
        controller: "SecondaryNavigationController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.navigation.left;
        }]
    })
    .component("rightNavBar", {
        controller: "SecondaryNavigationController",
        templateUrl: ["conf.paths", function (paths) {
            return paths.site.files.navigation.right;
        }]

    });
