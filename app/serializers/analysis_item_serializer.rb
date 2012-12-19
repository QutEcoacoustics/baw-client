require 'common_attributes'

class AnalysisItemSerializer < CommonAttributesSerializer
  attributes :id, :worker_info, :worker_started_utc,
             :worker_run_details, :status, :offset_start_seconds,
             :offset_end_seconds

  #has_one :audio_recording

  #has_one :analysis_job

end

