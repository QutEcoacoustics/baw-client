class AudioEventTag < ActiveRecord::Base

  # relations
  belongs_to :audio_event
  belongs_to :tag

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id

  # validations
  validates :audio_event_id, :presence => true
  validates :tag_id, :presence => true

end