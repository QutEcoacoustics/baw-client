angular
    .module("bawApp.navigation.menuDefinition", [])
    .factory("MenuDefinition", [
        "conf.paths",
        function (paths) {
            const omnipresentLinks = [
                {
                    title: "Home",
                    href: paths.api.links.homeAbsolute,
                    icon: "home",
                    target: "_self"
                },
                {
                    title: "Log in",
                    href: paths.api.links.loginActualAbsolute,
                    icon: "sign-in",
                    condition: user => user === null,
                    target: "_self"
                },
                {
                    title: "My Profile",
                    href: paths.api.links.myAccountAbsolute,
                    icon: "user",
                    condition: user => user !== null,
                    target: "_self"
                },
                {
                    title: "Register",
                    href: paths.api.links.registerAbsolute,
                    icon: "user-plus",
                    condition: user => user === null,
                    target: "_self"
                },
                {
                    title: "My Annotations",
                    href: user => user.annotationUrl,
                    icon: "square-o",
                    condition: user => user !== null,
                    target: "_self"
                },
                {
                    title: "Projects",
                    href: paths.api.links.projectsAbsolute,
                    icon: "globe",
                    target: "_self"
                },
                {
                    title: "Audio Analysis",
                    href: paths.site.ngRoutes.analysisJobs.list,
                    icon: "server",
                    ribbon: "beta"
                },
                {
                    title: "Library",
                    href: paths.site.ngRoutes.library,
                    icon: "book"
                },
                {
                    title: "Data Request",
                    href: paths.api.links.dataRequestAbsolute,
                    icon: "table",
                    target: "_self"
                },
                {
                    title: "Send Audio",
                    href: paths.api.links.dataUploadAbsolute,
                    icon: "envelope",
                    target: "_self"
                },
                {
                    title: "Report Problem",
                    href: paths.api.links.bugReportAbsolute,
                    icon: "bug",
                    target: "_self"
                },
                {
                    title: "Website Statistics",
                    href: paths.api.links.websiteStatusAbsolute,
                    icon: "line-chart",
                    target: "_self"
                },

            ];

            return omnipresentLinks;
        }
    ]);

