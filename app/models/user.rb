class User < ActiveRecord::Base
  before_validation :ensure_password

  # NB: this intentionally left simple
  #   The bulk of the emails populated into this model will come from external authentication providers
  VALID_EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]+$/

  # Include devise modules.
  # :registerable,:rememberable,
  devise  :confirmable, :omniauthable, :token_authenticatable,
          :trackable, :database_authenticatable, :lockable,
          :validatable, :timeoutable,   :recoverable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :user_name, :display_name, :email, :is_fake_email, :password, :admin



  # userstamp
  model_stamper # this identifies this class as being the class that 'stamps'
  acts_as_paranoid
  stampable
  belongs_to :user, class_name: 'User', foreign_key: :creator_id
  validates_as_paranoid

  # other associations
  has_many :authorizations, :dependent => :destroy
  has_many :projects, :foreign_key => :creator_id
  has_many :sites, :foreign_key => :creator_id
  has_many :audio_recordings, :foreign_key => :creator_id
  has_many :audio_events, :foreign_key => :creator_id
  has_many :tags, :foreign_key => :creator_id
  has_many :audio_event_tags, :foreign_key => :creator_id
  has_many :permissions_created, :class_name => 'Permission', :foreign_key => :creator_id
  has_many :permissions
  has_many :analysis_scripts, :foreign_key => :creator_id
  has_many :analysis_jobs, :foreign_key => :creator_id
  has_many :progresses, :foreign_key => :creator_id
  has_many :bookmarks, :foreign_key => :creator_id
  has_many :saved_searches, :foreign_key => :creator_id

  # validation
  #validates_presence_of :display_name
  validates :user_name, presence: true, uniqueness: { case_sensitive: false },
            exclusion: { in: %w(admin harvester analysis_runner) }, unless: :skip_user_name_exclusion_list
            #:format => { :with => /\A[a-zA-Z0-9_ ]+\z/, :message => "only letters, numbers, space and underscore allowed" }
  validates :display_name, #uniqueness: { case_sensitive: false },
            presence: { unless: Proc.new { |a| a.email.present? }, message: 'Please provide a display name, email, or both.' }

  # it turns out devise provdes its own validations for the email field
  # providing our own (e.g.uniqueness) creates duplicated errors! #uniqueness: { case_sensitive: false },
  validates :email, format: {with:VALID_EMAIL_REGEX, message: 'Basic email validation failed. It should have at least 1 `@` and 1 `.`'}

  #friendly_id :display_name, :use_slug => true, :strip_non_ascii => true

  # special validation skip
  # these methods allow a temporary skip of exclusion validation. this is used for seeding users into the database
  # TODO: does this need some protection?
  def skip_user_name_exclusion_list=(value)
    @skip_user_name_exclusion_list = value
  end

  def skip_user_name_exclusion_list
    @skip_user_name_exclusion_list
  end

  private

  def ensure_password
    self.password = Devise.friendly_token[0,20] if self.password.blank?
  end

end
