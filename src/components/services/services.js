angular.module(
    "bawApp.services",
    [
        // general helpers
        "http-auth-interceptor",
        "bawApp.configuration",
        "bawApp.vendorServices",
        "bawApp.services.resource",
        "bawApp.services.unitConverter",
        "bawApp.services.queryBuilder",


        // endpoint specific
        "bawApp.services.bookmark",
        "bawApp.services.project",
        "bawApp.services.site",
        "bawApp.services.audioEventComment",
        "bawApp.services.audioRecording",
        "bawApp.services.audioEvent",
        "bawApp.services.taggings",
        "bawApp.services.tag",
        "bawApp.services.media",
        "bawApp.services.birdWalkService",
        "bawApp.services.breadcrumbs",
        "bawApp.services.userProfile",
        "bawApp.services.authenticator"

    ]);















