angular.module(
    "bawApp.models",
    [
        "bawApp.configuration",
        "rails",
        "bawApp.services",
        "bawApp.models.associations",
        //
        // endpoint specific
        "bawApp.models.analysisJob",
        "bawApp.models.analysisResult",
        //"bawApp.models.bookmark",
        "bawApp.models.project",
        "bawApp.models.site",
        //"bawApp.models.audioEventComment",
        "bawApp.models.audioRecording",
        "bawApp.models.audioEvent",
        //"bawApp.models.taggings",
        "bawApp.models.tag",
        "bawApp.models.media",
        "bawApp.models.savedSearch",
        "bawApp.models.script",
        //"bawApp.models.birdWalkService",
        //"bawApp.models.breadcrumbs",
        "bawApp.models.userProfile",
        //"bawApp.models.authenticator",
        "bawApp.models.datasetItem",
        "bawApp.models.progressEvent",
        "bawApp.models.question",
        "bawApp.models.questionResponse"

    ]);


