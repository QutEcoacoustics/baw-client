
class AudioEventSerializer < ActiveModel::Serializer
  attributes :id, :audio_recording_id, :end_time_seconds, :high_frequency_hertz, :is_reference,
             :low_frequency_hertz, :start_time_seconds

  has_many :audio_event_tags


end

