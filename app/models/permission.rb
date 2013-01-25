class Permission < ActiveRecord::Base
  extend Enumerize

  # relations
  belongs_to :user
  belongs_to :permissionable, :polymorphic => true

  # attr
  attr_accessible :user_id, :level, :permissionable_type, :permissionable_id

  # userstamp
  stampable
  belongs_to :user, class_name: 'User', foreign_key: :creator_id

  # enumerations
  AVAILABLE_LEVELS = [:owner, :writer, :reader, :none].map{ |item| item.to_s }
  enumerize :level, :in => AVAILABLE_LEVELS, :default => :none, predicates: true
  validates :level, :inclusion => {in: AVAILABLE_LEVELS}, :presence => true

  # validation
  validate :anonymous_permission_can_only_be_read_or_none

  # custom validation methods
  def anonymous_permission_can_only_be_read_or_none
    return unless self.user.nil?

    return if self.reader? || self.none?

    errors.add(:level, "The permission level can only be 'read' or 'none' for anonymous permissions")
  end

  # methods
  def anonymous?
    self.user.nil?
  end

  # http://stackoverflow.com/questions/11569940/inclusion-validation-fails-when-provided-a-symbol-instead-of-a-string
  # this lets a symbol be set, and it all still works
  def level=(new_level)
    super new_level.to_s
  end

end
