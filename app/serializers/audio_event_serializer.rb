require 'common_attributes'
require 'audio_event_serializer'

class AudioRecordingIdsSerializer < CommonAttributesSerializer
  attributes :id, :uuid
end

class AudioEventTagsInAESerializer < CommonAttributesSerializer
  attributes :audio_event_id, :tag_id
end


class AudioEventSerializer < CommonAttributesSerializer
  attributes :id, :audio_recording_id, :end_time_seconds, :high_frequency_hertz, :is_reference,
             :low_frequency_hertz, :start_time_seconds

  has_many :audio_event_tags, :AudioEventTagsSerializer => AudioEventTagsInAESerializer
  has_one :audio_recording, :serializer => AudioRecordingIdsSerializer


end

