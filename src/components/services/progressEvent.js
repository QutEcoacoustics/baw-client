angular
    .module("bawApp.services.progressEvent", [])
    .factory(
        "ProgressEvent",
        [
            "$rootScope",
            "$resource",
            "$http",
            "bawResource",
            "$url",
            "conf.paths",
            "baw.models.progressEvent",
            "baw.models.datasetItem.defaultDatasetId",
            function ($rootScope, $resource, $http, bawResource, $url, paths, ProgressEventModel, defaultDatasetId) {

                var resource = bawResource(
                    paths.api.routes.progressEvent.listAbsolute,
                    {},
                    {});

                resource.createProgressEvent = function createProgressEvent(datasetItemId, activity) {
                    if (!$rootScope.$loggedIn) {
                        console.warn("createProgressEvent: creating progress event on server cancelled because no user is logged in");
                        return;
                    }

                    var progressEvent = new ProgressEventModel();
                    progressEvent.activityKey = activity;
                    progressEvent.datasetItemId = datasetItemId;
                    var url = $url.formatUri(paths.api.routes.progressEvent.listAbsolute);
                    return $http.post(url, progressEvent).then(x => {
                        return ProgressEventModel.makeFromApi(x);
                    }, x => {
                        console.log("Error creating progress event from dataset item attributes", x);
                    });

                };

                resource.createByDatasetItemAttributes = function createByDatasetItemAttributes(datasetId, audioRecordingId, startTimeSeconds, endTimeSeconds, activity) {
                    if (!$rootScope.$loggedIn) {
                        console.warn("createByDatasetItemAttributes: creating progress event on server cancelled because no user is logged in");
                        return;
                    }

                    var routeParams = {
                        datasetId: datasetId,
                        audioRecordingId: audioRecordingId,
                        startTimeSeconds: startTimeSeconds,
                        endTimeSeconds: endTimeSeconds
                    };

                    var progressEvent = new ProgressEventModel();
                    progressEvent.activityKey = activity;
                    var url = $url.formatUri(paths.api.routes.progressEvent.createByDatasetItemAttributesAbsolute, routeParams);

                    return $http.post(url, progressEvent).then(x => {
                        console.log("__success creating progress event");
                        return ProgressEventModel.makeFromApi(x);
                    }, x => {
                        console.log("__Error creating progress event from dataset item attributes", x);
                    });
                };


                resource.progressEvents = function getProgressEvents(pageNum) {
                    var url = $url.formatUri(paths.api.routes.progressEvents.listAbsolute, {page: pageNum});
                    return $http.get(url).then(x => {
                        return ProgressEventModel.makeFromApi(x);
                    });
                };

                resource.progressEvent = function getProgressEvent(progressEventId) {
                    var url = $url.formatUri(paths.api.routes.progressEvent.showAbsolute, {progressEventId: progressEventId});
                    return $http.get(url).then(x => ProgressEventModel.makeFromApi(x));
                };

                return resource;
            }
        ]
    );