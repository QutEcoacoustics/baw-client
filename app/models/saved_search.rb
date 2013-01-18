class SavedSearch < ActiveRecord::Base

  # relations
  has_many :progresses
  belongs_to :user, class_name: 'User', foreign_key: :owner_id

  # attr
  attr_accessible :name,
                  :search_object,   # a string (text type) based representation of a saved search
                                    #   the format is json
                  :owner_id

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id

  # validation
  validates :search_object, :presence => true
  validates_uniqueness_of :search_object,
                          :scope => [:creator_id, :name]

  # custom methods
  def implicit_global?
    name.blank? && owner_id.blank?
  end

  def explicit_global?
    !name.blank? && owner_id.blank?
  end

  def implicit_personal?
    name.blank? && !owner_id.blank?
  end

  def explicit_personal?
    !name.blank? && !owner_id.blank?
  end
end
