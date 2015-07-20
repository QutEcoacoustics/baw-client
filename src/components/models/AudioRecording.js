angular
    .module("bawApp.models.audioRecording", [])
    .factory(
    "baw.models.AudioRecording",
    [
        "baw.models.ApiBase",
        "conf.paths",
        "$url",
        "Tag",
        function (ApiBase, paths, url, Tag) {

            class AudioRecording extends ApiBase {
                constructor(resource) {
                    super(resource);
                }
            }

            return AudioRecording;
        }]);
