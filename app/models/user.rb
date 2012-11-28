class User < ActiveRecord::Base
  # Include devise modules.
  devise  :confirmable, :omniauthable, :registerable,
          :recoverable, :rememberable, :token_authenticatable,
          :trackable, :database_authenticatable, :lockable,
          :validatable, :timeoutable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :display_name, :email, :password, :admin
  has_many :authorizations, :dependent => :destroy

  # user stamp
  model_stamper
  stampable

  # other associations
  has_many :projects
  has_many :sites
  has_many :audio_recordings
  has_many :audio_events
  has_many :tags
  has_many :audio_event_tags
  has_many :permissions

  # validation
  validates_presence_of :display_name
  validates_uniqueness_of :display_name, :email, :case_sensitive => false
  #friendly_id :display_name, :use_slug => true, :strip_non_ascii => true
end
