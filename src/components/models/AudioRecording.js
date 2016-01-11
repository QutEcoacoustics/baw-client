angular
    .module("bawApp.models.audioRecording", [])
    .factory(
        "baw.models.AudioRecordingCore",
        [
            "baw.models.ApiBase",
            "conf.paths",
            "$url",
            "Tag",
            function (ApiBase, paths, url, Tag) {

                /**
                 * A core AudioRecording model uses especially for low
                 * attribute projections - like needed for the visualization
                 * pages.
                 */
                class AudioRecording extends ApiBase {
                    constructor(resource) {
                        super(resource);

                        if ((typeof this.durationSeconds) === "string") {
                            this.durationSeconds = Number(this.durationSeconds);
                        }

                        this.durationMilliseconds = this.durationSeconds * 1000;


                        this.recordedDate = new Date(this.recordedDate);
                        this.recordedDateMilliseconds = this.recordedDate.getTime();
                        this.recordedEndDateMilliSeconds = this.recordedDateMilliseconds + this.durationMilliseconds;
                    }


                }

                return AudioRecording;
            }])
    .factory(
        "baw.models.AudioRecording",
        [
            "baw.models.ApiBase",
            "baw.models.AudioRecordingCore",
            "conf.paths",
            "$url",
            "Tag",
            function (ApiBase, AudioRecordingCore, paths, url, Tag) {

                class AudioRecording extends AudioRecordingCore {
                    constructor(resource) {
                        super(resource);
                    }
                }

                return AudioRecording;
            }]);
