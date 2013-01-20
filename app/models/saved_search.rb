require_relative '../../lib/modules/JSON_patch'

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
  #validates_uniqueness_of :search_object, :scope => [:creator_id, :name]
  validates_uniqueness_of :name, :scope => [:owner_id]

  validate :json_format


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

  protected

  def json_format

    errors.add(:search_object, 'search_object not in json format') unless JSON.is_json?(search_object)
  end

end
