class User < ActiveRecord::Base
  # Include devise modules. Others available are:
  # :database_authenticatable, :lockable, :recoverable, :rememberable
  # :validatable, :timeoutable,
  devise  :confirmable, :omniauthable, :registerable,
           :token_authenticatable, :trackable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :display_name, :email
  has_many :authorizations, :dependent => :destroy
  
  # user stamp
  model_stamper
  stampable

  # validation
  validates_presence_of :display_name
  validates_uniqueness_of :display_name, :email, :case_sensitive => false
  #friendly_id :display_name, :use_slug => true, :strip_non_ascii => true
end
