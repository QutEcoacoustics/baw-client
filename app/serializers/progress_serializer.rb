require 'common_attributes'

class ProgressSerializer < CommonAttributesSerializer
  attributes :id, :saved_search_id, :audio_recording_id,
             :activity, :start_offset_seconds, :end_offset_seconds, :offset_list,
             :creator_id
end