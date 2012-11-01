class AudioEventTag < ActiveRecord::Base
  belongs_to :audio_event
  belongs_to :tag

  # userstamp
  stampable
  belongs_to :user

end