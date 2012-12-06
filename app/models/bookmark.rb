class Bookmark < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  belongs_to :audio_recording

  # attr
  attr_accessible :name, :notes, :offset, :audio_recording_id

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id

  # validation
  validates :offset,  :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }
  validates :audio_recording_id, :presence => true



end
