angular
    .module("bawApp.models.questionResponse", [])
    .factory("baw.models.questionResponse", [
        "baw.models.ApiBase",
        function (ApiBase) {

            class QuestionResponse extends ApiBase {

                constructor(resource) {
                    super(resource);
                }

                get questionResponseData() {
                    return JSON.parse(this.data);
                }

                set questionResponseData(value) {
                    this.data = JSON.stringify(value);
                }


            }

            return QuestionResponse;
        }]);
