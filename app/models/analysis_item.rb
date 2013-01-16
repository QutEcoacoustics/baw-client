class AnalysisItem < ActiveRecord::Base
  # relations
  belongs_to :audio_recording
  belongs_to :analysis_job

  # attr
  attr_accessible :audio_recording_id, :offset_end_seconds, :offset_start_seconds,
                  :status, :worker_info, :worker_run_details, :worker_started_utc

  accepts_nested_attributes_for :analysis_job, :audio_recording

  # validations
  validates :offset_start_seconds, presence: true, numericality: {greater_than_or_equal_to: 0}
  validates :offset_end_seconds, presence: true, numericality: {greater_than_or_equal_to: 0}
  validate :start_must_be_lte_end

  validates :audio_recording_id, presence: true

  # documentation for timeliness: https://github.com/adzap/validates_timeliness
  validates :worker_started_utc,  allow_nil: true, allow_blank: true, timeliness: {type: :datetime,  on_or_before: :now}
  validates :status, inclusion: {in: [:ready, :running, :complete, :error]}, presence: true

  # custom validation methods
  def start_must_be_lte_end
    return unless offset_end_seconds && offset_start_seconds

    if offset_start_seconds > offset_end_seconds then
      errors.add(:offset_start_seconds, "must be lower than end time")
    end
  end
end
