class Authorization < ActiveRecord::Base
  # no attributes are publicly accessible, all are used only internally
  # attr_accessible :link, :name, :provider, :secret, :token, :uid, :user_id
  attr_accessible

  belongs_to :user
end
