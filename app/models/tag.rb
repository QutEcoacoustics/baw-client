class Tag < ActiveRecord::Base
  #extend Enumerize

  # relations
  has_many :audio_event_tags
  has_many :audio_events, :through => :audio_event_tags

  # attr
  attr_accessible :class, :is_taxanomic, :text, :type_of_tag

  # userstamp
  stampable
  belongs_to :user
  acts_as_paranoid
  validates_as_paranoid

  # enums
  #enumerize :class, :in => [:looks_like, :sounds_like], predicates: true
  #enumerize :type_of_tag, :in => [:common_name, :species_name], predicates: true

  # validation
  validates :is_taxanomic, :presence => true
  validates :text, :uniqueness => { :case_sensitive => false }
  validate :class_mutually_exclusive_with_tag_type

  # custom validation
  def class_mutually_exclusive_with_tag_type
    return if self.class.nil? || self.type.nil?

    errors.add(:class, "class and type_of_tag cannot both be set")
    errors.add(:type_of_tag, "class and type_of_tag cannot both be set")
  end

  private
  # default values
  after_initialize :init
  def init
    self.is_taxanomic ||= false
  end
end
