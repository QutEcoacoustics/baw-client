class AnalysisItem < ActiveRecord::Base
  # relations
  belongs_to :audio_recording
  belongs_to :analysis_job

  # attr
  attr_accessible :audio_recording_id, :offset_end_seconds, :offset_start_seconds,
                  :status, :worker_info, :worker_run_details, :worker_started_utc

  accepts_nested_attributes_for :analysis_job, :audio_recording

  # validations
  validates :offset_start_seconds, presence: true, numericality: true
  validates :offset_end_seconds, presence: true, numericality: true
  validates :audio_recording_id, presence: true
  # documentation for timeliness: https://github.com/adzap/validates_timeliness
  validates :worker_started_utc, timeliness: {type: :datetime, allow_blank: true}
  validates :status, inclusion: {in: %w(ready running complete error)}
end
