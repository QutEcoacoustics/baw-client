class Bookmark < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  belongs_to :audio_recording

  # attr
  attr_accessible :name, :notes,
                  :offset_seconds, # offset since start of audio recording
                  :audio_recording_id

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id

  # validation
  validates :offset_seconds,  :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }
  validates :audio_recording_id, :presence => true



end
