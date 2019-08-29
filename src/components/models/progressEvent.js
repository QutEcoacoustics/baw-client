angular
    .module("bawApp.models.progressEvent", [])
    .constant("baw.models.progressEvent.activities", {
        "viewed": "viewed",
        "played": "played",
        "interacted": "interacted"
    })
    .factory("baw.models.progressEvent", [
        "baw.models.ApiBase",
        "baw.models.progressEvent.activities",
        function (ApiBase, activities) {

            class ProgressEvent extends ApiBase {

                constructor(resource) {
                    super(resource);
                }

                set activityKey(key) {
                    this.activity = activities[key];
                    this._activityKey = key;
                }

                get activityKey() {
                    return this._activityKey;
                }

            }

            return ProgressEvent;
        }]);
