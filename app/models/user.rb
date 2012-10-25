class User < ActiveRecord::Base
  attr_accessible :display_name
  
  # user stamp
  model_stamper
  stampable
end
