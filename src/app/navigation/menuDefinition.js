angular
    .module("bawApp.navigation.menuDefinition", [])
    .factory("MenuDefinition", [
        "conf.paths",
        function (paths) {
            const omnipresentLinks = [
                {
                    title: "Home",
                    href: paths.api.links.homeAbsolute,
                    tooltip: "Home page",
                    icon: "home",
                    target: "_self"
                },
                {
                    title: "Log in",
                    href: paths.api.links.loginActualAbsolute,
                    tooltip: "Log into the website",
                    icon: "sign-in",
                    predicate: user => user === null,
                    target: "_self"
                },
                {
                    title: "My Profile",
                    href: paths.api.links.myAccountAbsolute,
                    tooltip: "View my profile",
                    icon: "user",
                    predicate: user => user !== null,
                    target: "_self"
                },
                {
                    title: "Register",
                    href: paths.api.links.registerAbsolute,
                    tooltip: "Create an account",
                    icon: "user-plus",
                    predicate: user => user === null,
                    target: "_self"
                },
                {
                    title: "My Annotations",
                    href: user => user.annotationUrl,
                    tooltip: "View my recent annotations",
                    icon: "baw-annotation",
                    predicate: user => user !== null,
                    target: "_self"
                },
                {
                    title: "Projects",
                    href: paths.api.links.projectsAbsolute,
                    tooltip: "View projects I have access to",
                    icon: "globe",
                    target: "_self"
                },
                {
                    title: "Audio Analysis",
                    href: paths.site.ngRoutes.analysisJobs.listAbsolute,
                    tooltip: "View audio analysis jobs",
                    icon: "server",
                    ribbon: "beta"
                },
                {
                    title: "Library",
                    href: paths.site.ngRoutes.libraryAbsolute,
                    tooltip: "Annotation library",
                    icon: "book"
                },
                {
                    title: "Data Request",
                    href: paths.api.links.dataRequestAbsolute,
                    tooltip: "Request customized data from the website",
                    icon: "table",
                    target: "_self"
                },
                {
                    title: "Send Audio",
                    href: paths.api.links.dataUploadAbsolute,
                    tooltip: "Send us audio recordings to upload",
                    icon: "envelope",
                    target: "_self"
                },
                {
                    title: "Report Problem",
                    href: paths.api.links.bugReportAbsolute,
                    tooltip: "Report a problem with the website",
                    icon: "bug",
                    target: "_self"
                },
                {
                    title: "Website Statistics",
                    href: paths.api.links.websiteStatusAbsolute,
                    tooltip: "Annotation and audio recording stats",
                    icon: "line-chart",
                    target: "_self"
                },

            ];

            return omnipresentLinks;
        }
    ]);

