class AudioEventTag < ActiveRecord::Base

  # relations
  belongs_to :audio_event
  belongs_to :tag

  accepts_nested_attributes_for :audio_event

  # attr
  attr_accessible :audio_event, :tag,
                  :tag_id

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id

  # validations
  validates_presence_of  :audio_event
  #validates_presence_of  :tag_id

  #validates_uniqueness_of :audio_event,
  #                        :scope => [:tag]
end