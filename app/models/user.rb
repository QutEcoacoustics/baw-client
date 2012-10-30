class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :database_authenticatable, :lockable, :recoverable,
  # :validatable, :timeoutable,
  devise  :confirmable, :omniauthable, :registerable,
           :token_authenticatable, :trackable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me
  attr_accessible :display_name
  
  # user stamp
  model_stamper
  stampable

  # validation
  validates_presence_of :display_name
  validates_uniqueness_of :display_name, :email, :case_sensitive => false
end
