class AnalysisItem < ActiveRecord::Base
  extend Enumerize

  # relations
  belongs_to :audio_recording
  belongs_to :analysis_job

  # attr
  attr_accessible :audio_recording_id, :offset_end_seconds, :offset_start_seconds,
                  :status, :worker_info, :worker_run_details, :worker_started_utc, :analysis_job_id

  accepts_nested_attributes_for :analysis_job, :audio_recording

  # enums
  AVAILABLE_STATUSES = [:ready, :running, :complete, :error].map{ |item| item.to_s }
  enumerize :status, in: AVAILABLE_STATUSES, :default => :ready, predicates: true
  validates :status, inclusion: {in: AVAILABLE_STATUSES}, presence: true

  # validations
  validates :offset_start_seconds, presence: true, numericality: {greater_than_or_equal_to: 0}
  validates :offset_end_seconds, presence: true, numericality: {greater_than_or_equal_to: 0}
  validate :start_must_be_lte_end

  validates :audio_recording_id, presence: true

  # documentation for timeliness: https://github.com/adzap/validates_timeliness
  validates :worker_started_utc,  allow_nil: true, allow_blank: true, timeliness: {type: :datetime,  on_or_before: :now}


  # custom validation methods
  def start_must_be_lte_end
    return unless offset_end_seconds && offset_start_seconds

    if offset_start_seconds > offset_end_seconds then
      errors.add(:offset_start_seconds, "must be lower than end time")
    end
  end

  # http://stackoverflow.com/questions/11569940/inclusion-validation-fails-when-provided-a-symbol-instead-of-a-string
  # this lets a symbol be set, and it all still works
  def status=(new_status)
    super new_status.to_s
  end
end
