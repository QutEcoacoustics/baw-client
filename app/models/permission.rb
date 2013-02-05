class Permission < ActiveRecord::Base
  extend Enumerize

  # relations
  belongs_to :user
  belongs_to :permissionable, :polymorphic => true

  # attr
  attr_accessible :user_id, :level, :logged_in, :permissionable_type, :permissionable_id

  # userstamp
  stampable
  belongs_to :user, class_name: 'User', foreign_key: :creator_id

  # enumerations
  AVAILABLE_LEVELS = [:owner, :writer, :reader, :none].map{ |item| item.to_s }
  enumerize :level, :in => AVAILABLE_LEVELS, :default => :none, predicates: true
  validates :level, :inclusion => {in: AVAILABLE_LEVELS}, :presence => true

  # validation
  validate :check_invalid_combinations

  # custom validation methods
  def check_invalid_combinations
    # any logged in user can be an owner? No
    if self.logged_in && self.owner? && self.user.blank?
      errors.add(:user_id, "Owner permissions must be specified with a user id.")
    end

    # any anonymous user can be an owner? No
    if !self.logged_in && self.owner? && self.user.blank?
      errors.add(:level, "Anonymous users cannot have owners permission.")
    end

    # any anonymous user can be an owner? No
    if !self.logged_in && self.writer? && self.user.blank?
      errors.add(:level, "Anonymous users cannot have writer permission.")
    end

    # not logged in and user id specified is not allowed
    if !self.logged_in && !self.user.blank?
      errors.add(:user_id, "Permissions cannot have a user id and not be logged in.")
    end
  end

  # methods
  def anonymous?
    self.user.blank?
  end

  # http://stackoverflow.com/questions/11569940/inclusion-validation-fails-when-provided-a-symbol-instead-of-a-string
  # this lets a symbol be set, and it all still works
  def level=(new_level)
    super new_level.to_s
  end

end
