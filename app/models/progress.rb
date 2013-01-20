class Progress < ActiveRecord::Base
  # this model is a 6-way composite key with a value between these fields:
  # user, activity, saved search, audio recording, start offset, and end offset

  # relations
  belongs_to :saved_search
  belongs_to :audio_recording

  # attr          #   JSON encoded array or offsets (in seconds)
  attr_accessible :offset_list, # <- this is the actual data packet

                  # ↓ these are just keys ↓
                  :activity, :saved_search_id, :audio_recording_id,
                  :start_offset_seconds, :end_offset_seconds


  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id

  # validation
  validates_uniqueness_of :activity,
                          case_sensitive: false,
                          scope:          [:saved_search_id, :audio_recording_id,
                                           :start_offset_seconds, :end_offset_seconds, :creator_id]

  validates_presence_of :offset_list,
                        :activity, :saved_search_id, :audio_recording_id,
                        :start_offset_seconds, :end_offset_seconds, :creator_id

  validates :start_offset_seconds, :presence => true, :numericality => { :greater_than_or_equal_to => 0 }
  validates :end_offset_seconds, :presence => true, :numericality => { :greater_than_or_equal_to => 0 }
  validate :start_time_must_be_lte_end_time

  # custom validation methods
  def start_time_must_be_lte_end_time
    return if start_offset_seconds.nil? || end_offset_seconds.nil?

    if start_offset_seconds > end_offset_seconds then
      errors.add(:start_time_seconds, " start offset must be lower than end offset")
    end
  end


end
