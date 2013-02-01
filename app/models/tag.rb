class Tag < ActiveRecord::Base
  extend Enumerize

  # relations
  has_many :audio_event_tags
  has_many :audio_events, :through => :audio_event_tags
  accepts_nested_attributes_for :audio_events

  # attr
  attr_accessible :is_taxanomic, :text, :type_of_tag

  # userstamp
  stampable
  belongs_to :user, class_name: 'User', foreign_key: :creator_id
  #acts_as_paranoid # deletable, not archiveable
  #validates_as_paranoid

  # enums
  AVAILABLE_TYPE_OF_TAGS = [:common_name, :species_name, :looks_like, :sounds_like].map{ |item| item.to_s }
  enumerize :type_of_tag, in: AVAILABLE_TYPE_OF_TAGS, predicates: true
  validates :type_of_tag, :inclusion => {in: AVAILABLE_TYPE_OF_TAGS}, :presence => true

  # validation
  validates :is_taxanomic, inclusion: { in: [true, false] }
  validates :text, uniqueness: { case_sensitive: false }


  validate :no_nils

  # custom validation methods
  def no_nils
    if text.nil? then
      errors.add(:text, "text must not be nil")
    end
  end
  #validate :class_mutually_exclusive_with_tag_type

  # custom validation
  #def class_mutually_exclusive_with_tag_type
  #  return if self.class.nil? || self.type.nil?
  #
  #  errors.add(:class, "class and type_of_tag cannot both be set")
  #  errors.add(:type_of_tag, "class and type_of_tag cannot both be set")
  #end

  # http://stackoverflow.com/questions/11569940/inclusion-validation-fails-when-provided-a-symbol-instead-of-a-string
  # this lets a symbol be set, and it all still works
  def type_of_tag=(new_type_of_tag)
    super new_type_of_tag.to_s
  end

  private
  # default values
  after_initialize :init
  def init
    self.is_taxanomic ||= false
  end
end
