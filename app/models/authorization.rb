class Authorization < ActiveRecord::Base
  # no attributes are publicly accessible, all are used only internally
  # to be able to assign values to the attributes, need to expose them here
  attr_accessible :link, :name, :provider, :secret, :token, :uid, :user_id

  belongs_to :user

  validates :uid, uniqueness: { case_sensitive: false, scope: :provider }
  validates :name, uniqueness: { case_sensitive: false, scope: :provider }
  validates :link, uniqueness: { case_sensitive: false }
end
