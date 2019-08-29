angular
    .module("bawApp.models.question", [])
    .factory("baw.models.question", [
        "baw.models.ApiBase",
        function (ApiBase) {

            class Question extends ApiBase {
                constructor(resource) {
                    super(resource);
                    this.customSettings = this.customSettings || null;
                }

                get questionData() {
                    return JSON.parse(this.data);
                }

                set questionData(value) {
                    this.data = JSON.stringify(value);
                }

            }

            return Question;
        }]);
