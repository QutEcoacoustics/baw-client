angular
    .module("bawApp.services.question", [])
    .factory(
        "Question",
        [
            "$resource",
            "$http",
            "bawResource",
            "$url",
            "conf.paths",
            "baw.models.question",
            function ($resource, $http, bawResource, $url, paths, QuestionModel) {

                var resource = bawResource(
                    paths.api.routes.question.list,
                    {studyId: "@studyId", questionId: "@questionId"},
                    {});

                resource.questions = function getQuestions(studyId) {
                    var url = $url.formatUri(paths.api.routes.question.listAbsolute, {studyId: studyId});
                    return $http.get(url).then(x => {
                        return QuestionModel.makeFromApi(x);
                    });
                };

                resource.question = function getQuestion(questionId) {
                    var url = $url.formatUri(paths.api.routes.question.showAbsolute, {questionId: questionId});
                    return $http.get(url).then(x => QuestionModel.makeFromApi(x));
                };

                return resource;
            }
        ]
    );