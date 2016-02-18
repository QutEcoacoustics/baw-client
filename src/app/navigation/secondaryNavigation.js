angular
    .module("bawApp.navigation.secondaryNavigation", [])
    .factory("ActiveResource", function () {
        var activeResource = {
            resource: null,
            set(newValue) {
                this.resource = newValue;
            },
            get() {
                return this.resource;
            }
        };

        return activeResource;
    })
    .controller("SecondaryNavigationController", [
        "$rootScope", "$location", "$route", "conf.paths", "ActiveResource",
        function ($rootScope, $location, $route, paths, ActiveResource) {
            var controller = this;

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
            this.activeResource = null;
            this.icon = null;

            $rootScope.$on("$routeChangeSuccess", onRouteChangeSuccess);
            $rootScope.$watch(
                () => ActiveResource.resource,
                () => controller.activeResource = ActiveResource.get()
            );

            function onRouteChangeSuccess(event, current, previous, rejection) {
                // reset the active resource
                ActiveResource.set(null);

                controller.title = current.$$route.title;
                controller.icon = current.$$route.icon;

                let currentLink = {title: controller.title, href: $location.$$path};
                let extraLinks = current.$$route.secondaryNavigation || [];

                controller.links = omnipresentLinks
                    .concat(extraLinks)
                    .concat(currentLink)
                    .map(activePath.bind(null, current.$$route));
            }

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
