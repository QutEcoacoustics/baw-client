class User < ActiveRecord::Base
  # Include devise modules.
  # :registerable,:rememberable,
  devise  :confirmable, :omniauthable, :token_authenticatable,
          :trackable, :database_authenticatable, :lockable,
          :validatable, :timeoutable,   :recoverable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :user_name, :display_name, :email, :password, :admin
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
  #validates_presence_of :display_name
  validates :user_name, :presence => true, :uniqueness => { :case_sensitive => false },
            :format => { :with => /\A[a-zA-Z0-9_ ]+\z/, :message => "only letters, numbers, space and underscore allowed" }
  validates :display_name, :uniqueness => {:case_sensitive => false }, :presence => { :unless => Proc.new { |a| a.email.present? }, :message => "Please provide a name, email, or both." }
  validates :email, :uniqueness => {:case_sensitive => false }, :presence => { :unless => Proc.new { |a| a.display_name.present? }, :message => "Please provide an email, name, or both." }
  #friendly_id :display_name, :use_slug => true, :strip_non_ascii => true
end
