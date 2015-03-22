angular
    .module("bawApp.models.audioEvent", [])
    .factory(
    "baw.models.AudioEvent",
    [
        "baw.models.ApiBase",
        "conf.paths",
        "$url",
        "moment",
        "Tag",
        function (ApiBase, paths, url, moment, Tag) {
            const _audioRecording = Symbol("audioRecording");

            class AudioEvent extends ApiBase {
                constructor(resource) {
                    super(resource);

                    this.durationSeconds = this.endTimeSeconds - this.startTimeSeconds;
                    this.bandwidthHertz = this.highFrequencyHertz - this.lowFrequencyHertz;

                    this.taggings = this.taggings || [];
                }

                get priorityTag() {
                    return Tag.selectSinglePriorityTag(
                        this.taggings.map(tagging => tagging.tag)
                    );
                }

                /**
                 * Returns the start date of the audio event in absolute time.
                 * Requires the audioRecording or media association to work
                 */
                get startDate() {
                    let date;
                    if (this.audioRecording && this.audioRecording.recordedDate) {
                        date = moment(this.audioRecording.recordedDate);
                    }
                    else if (this.media) {
                        date = moment(this.media.recordedDate);
                    }

                    return date ? date.add(this.startTimeSeconds, "s").toDate() : null;
                }

                get audioRecording() {
                    return this[_audioRecording];
                }

                set audioRecording(value) {
                    this[_audioRecording] = value;
                }

            }

            return AudioEvent;
        }]);
