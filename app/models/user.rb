class User < ActiveRecord::Base
  attr_accessible :display_name
  
  # user stamp
  model_stamper
  stampable


  # other associations
  has_many :projects
  has_many :sites
  has_many :audio_recordings
  has_many :audio_events

end
