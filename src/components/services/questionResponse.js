angular
    .module("bawApp.services.questionResponse", [])
    .factory(
        "QuestionResponse",
        [
            "$resource",
            "$http",
            "bawResource",
            "$url",
            "conf.paths",
            "baw.models.questionResponse",
            function ($resource, $http, bawResource, $url, paths, QuestionResponseModel) {

                var resource = bawResource(
                    paths.api.routes.questionResponse.listAbsolute,
                    {},
                    {});

                resource.createQuestionResponse = function createQuestionResponse(questionId, datasetItemId, studyId, data) {

                    var questionResponse = new QuestionResponseModel();
                    questionResponse.questionId = questionId;
                    questionResponse.studyId = studyId;
                    questionResponse.datasetItemId = datasetItemId;
                    questionResponse.questionResponseData = data;
                    var url = $url.formatUri(paths.api.routes.questionResponse.createAbsolute, {studyId: studyId, questionId: questionId});
                    return $http.post(url, questionResponse).then(x => {
                        return QuestionResponseModel.makeFromApi(x);
                    }, x => {
                        console.log("Error creating question response", x);
                    });

                };

                resource.questionResponses = function getQuestionResponses(params) {
                    var url = $url.formatUri(paths.api.routes.questionResponse.listAbsolute, params);
                    return $http.get(url).then(x => {
                        return QuestionResponseModel.makeFromApi(x);
                    });
                };

                resource.questionResponse = function getQuestionResponse(questionResponseId) {
                    var url = $url.formatUri(paths.api.routes.questionResponse.showAbsolute, {questionResponseId: questionResponseId});
                    return $http.get(url).then(x => QuestionResponseModel.makeFromApi(x));
                };

                return resource;
            }
        ]
    );