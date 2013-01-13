class AudioEvent < ActiveRecord::Base
  # relations
  belongs_to :audio_recording

  has_many :tags, :through => :audio_event_tags, :uniq => true
  #accepts_nested_attributes_for :tags

  has_many :audio_event_tags
  accepts_nested_attributes_for :audio_event_tags

  # attr
  attr_accessible :audio_recording_id, :end_time_seconds, :high_frequency_hertz, :is_reference,
                  :low_frequency_hertz, :start_time_seconds,
                  :tags_attributes, :audio_event_tags_attributes

  # userstamp
  stampable
  belongs_to :user, class_name: 'User', foreign_key: :creator_id
  acts_as_paranoid
  validates_as_paranoid

  # validation
  validates :audio_recording, presence: true
  validates :is_reference, inclusion: {in: [true, false]}

  validates :start_time_seconds, presence: true, numericality: {greater_than_or_equal_to: 0}
  validates :end_time_seconds, numericality: {greater_than_or_equal_to: 0}, allow_nil: true
  validate :start_must_be_lte_end

  validates :low_frequency_hertz, presence: true, numericality: {greater_than_or_equal_to: 0}
  validates :high_frequency_hertz, numericality: {greater_than_or_equal_to: 0}, allow_nil: true
  validate :low_must_be_lte_high

  # custom validation methods
  def start_must_be_lte_end
    return unless end_time_seconds && start_time_seconds

    if start_time_seconds > end_time_seconds then
      errors.add(:start_time_seconds, "must be lower than end time")
    end
  end

  def low_must_be_lte_high
    return unless high_frequency_hertz && low_frequency_hertz

    if low_frequency_hertz > high_frequency_hertz then
      errors.add(:start_time_seconds, "must be lower than high frequency")
    end
  end

end
