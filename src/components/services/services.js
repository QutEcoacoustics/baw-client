angular.module(
    "bawApp.services",
    [
        "rails",
        "url",

        // general helpers
        "http-auth-interceptor",
        "bawApp.configuration",
        "bawApp.vendorServices",
        "bawApp.services.resource",
        "bawApp.services.unitConverter",
        "bawApp.services.queryBuilder",
        "bawApp.services.predictiveCache",
        "bawApp.services.resultPager",

        // endpoint specific
        "bawApp.services.analysisJob",
        "bawApp.services.analysisResult",
        "bawApp.services.analysisResultFile",
        "bawApp.services.bookmark",
        "bawApp.services.project",
        "bawApp.services.site",
        "bawApp.services.audioEventComment",
        "bawApp.services.audioRecording",
        "bawApp.services.audioEvent",
        "bawApp.services.taggings",
        "bawApp.services.tag",
        "bawApp.services.mime",
        "bawApp.services.media",
        "bawApp.services.savedSearch",
        "bawApp.services.script",
        "bawApp.services.birdWalkService",
        "bawApp.services.breadcrumbs",
        "bawApp.services.userProfile",
        "bawApp.services.authenticator",
        "bawApp.services.datasetItem"

    ]);















