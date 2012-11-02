require 'enumerize'

class Permission < ActiveRecord::Base
  extend Enumerize

  # relations
  belongs_to :user
  belongs_to :permissionable, :polymorphic => true

  # attr
  attr_accessible :level, :permissionable_type, :permissionable_id

  # userstamp
  stampable
  # belongs_to :user

  # enumerations
  enumerize :level, :in => [:owner, :write, :read, :none], :default => :none, predicates: true

  # validation
  validates :level, :presence => true
  validate :anonymous_permission_can_only_be_read_or_none


  # custom validation methods
  def anonymous_permission_can_only_be_read_or_none
    return unless self.user_id.nil?

    return if self.read? || self.none?

    errors.add(:level, "The permission level can only be 'read' or 'none' for anonymous permissions")
  end

  # methods
  def anonymous?
    self.user.nil?
  end

end
