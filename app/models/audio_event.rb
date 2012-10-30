class AudioEvent < ActiveRecord::Base
  belongs_to :audio_recording

  attr_accessible :end_time_seconds, :high_frequency_hertz, :is_reference, :low_frequency_hertz, :start_time_seconds

  # userstamp
  stampable
  belongs_to :user
  acts_as_paranoid

  # validation
  validates :start_time_seconds, :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }
  validates :end_time_seconds, :presence => true,  :numericality => { :greater_than_or_equal_to  => 0 }
  validates :start_time_must_be_less_than_end_time, :presence => true

  validates :low_frequency_hertz, :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }
  validates :high_frequency_hertz, :presence => true,  :numericality => { :greater_than_or_equal_to  => 0 }
  validates :low_frequency_must_be_less_than_or_equal_to_high_frequency, :presence => true

  # custom validation methods
  def start_time_must_be_less_than_or_equal_to_end_time
    if start_time_seconds > end_time_seconds then
      errors.add(:start_time_seconds, "must be lower than end time")
    end
  end

  def low_frequency_must_be_less_than_or_equal_to_high_frequency
    if low_frequency_hertz > high_frequency_hertz then
      errors.add(:start_time_seconds, "must be lower than high frequency")
    end
  end
end
