angular
    .module("bawApp.services.study", [])
    .factory(
        "Study",
        [
            "$resource",
            "$http",
            "bawResource",
            "$url",
            "conf.paths",
            "baw.models.study",
            function ($resource, $http, bawResource, $url, paths, StudyModel) {

                var resource = bawResource(
                    paths.api.routes.study.list,
                    {studyId: "@studyId"},
                    {});


                resource.study = function getStudy(studyId) {
                    var url = $url.formatUri(paths.api.routes.study.showAbsolute, {studyId: studyId});
                    return $http.get(url).then(x => StudyModel.makeFromApi(x));
                };

                resource.studyByName = function getStudyByName(studyName) {
                    var url = $url.formatUri(paths.api.routes.study.filterAbsolute, {filter_name: studyName});
                    return $http.get(url).then(x => StudyModel.makeFromApi(x));
                };

                return resource;
            }
        ]
    );