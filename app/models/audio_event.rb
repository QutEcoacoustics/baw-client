class AudioEvent < ActiveRecord::Base
  # relations
  belongs_to :audio_recording
  has_many :audio_event_tags
  has_many :tags, :through => :audio_event_tags

  accepts_nested_attributes_for :tags

  # attr
  attr_accessible :audio_recording_id, :end_time_seconds, :high_frequency_hertz, :is_reference,
                  :low_frequency_hertz, :start_time_seconds

  # userstamp
  stampable
  belongs_to :user
  acts_as_paranoid
  validates_as_paranoid

  # validation
  validates :start_time_seconds, :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }
  validates :end_time_seconds, :numericality => { :greater_than_or_equal_to  => 0 }
  validate :start_time_must_be_lte_end_time

  validates :low_frequency_hertz, :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }
  validates :high_frequency_hertz,  :numericality => { :greater_than_or_equal_to  => 0 }
  validate :low_frequency_must_be_lte_high_frequency

  # custom validation methods
  def start_time_must_be_lte_end_time
    return unless end_time_seconds

    if start_time_seconds > end_time_seconds then
      errors.add(:start_time_seconds, "must be lower than end time")
    end
  end

  def low_frequency_must_be_lte_high_frequency
    return unless high_frequency_hertz

    if low_frequency_hertz > high_frequency_hertz then
      errors.add(:start_time_seconds, "must be lower than high frequency")
    end
  end
end
