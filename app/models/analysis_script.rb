class AnalysisScript < ActiveRecord::Base
  before_validation :populate_name
  after_initialize :init

  Whitelist_characters  = "a-zA-Z0-9_\\-\\."
  Negative_whitelist    = /[^#{Whitelist_characters}]/
  White_listed_filename = /^[#{Whitelist_characters}]+$/
  White_listed_filepath = /^([\\\/]?[#{Whitelist_characters}]+)?([\\\/][#{Whitelist_characters}]+)+$/

  def initialize
    @name_unforced = true
    super()
  end


  # flex store
  store :notes

                            # attr
  attr_accessible :display_name, # the original name given by the user to name the script,
                  #   e.g.: "My awesome/brilliant analysis!!"
                  :name, # a filesystem safe version of display_name (computed)
                  #   Note, this should not be a path
                  #   e.g.: "my_awesome_brilliant_analysis__"
                  :extra_data, # a manually entered settings file, copied to script dir on execution
                  :settings, # a file-path to a settings file

                  :description,
                  :notes,

                  :version, # an incrementing field tracking changes
                  :verified # whether or not this script has been checked (security purposes)
                            #   TODO: THIS FIELD SHOULD BE RESTRICTED

                            # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id
  acts_as_paranoid
  validates_as_paranoid

  # validations
  validates :name, presence: true, length: { minimum: 2, maximum: 255 },
            uniqueness:      { case_sensitive: false }
  validates_format_of :name, :with => White_listed_filename

  validates :display_name, presence: true, length: { minimum: 2, maximum: 255 }

  validates :settings, allow_nil: true, format: White_listed_filepath

  validates :version, presence: true
  validates :verified, inclusion: { in: [true, false] }


  # methods

  def init
    @name_unforced = true if @name_unforced.nil?
  end

  def display_name=(value)
    self[:display_name] = value
    if @name_unforced
      self[:name] = (make_safe_name value)
    end
  end

  def force_name=(value)
    self[:name]    = value
    @name_unforced = false
  end

  def name=(value)
    # if it the first value to be set, or name's are being forced, or the value is not blank -> then set it
    if self[:name].blank? || !@name_unforced || !value.blank?
      self[:name] = value
    else

    end

  end

  def populate_name
    if !display_name.blank? && name.blank? && @name_unforced
      self[:name] = make_safe_name display_name
    end
  end

  # removes invalid characters, and replaces them with underscores
  def make_safe_name(old)
    return old if old.blank?
    old = old.dup

    old = old.gsub(Negative_whitelist, '_')

    old = old.downcase

    # remove duplicates
    old = old.squeeze('_')

    # trim start and end chars
    if old[0] == '_'
      old = old[1..-1]
    end

    if old[-1] == '_'
      old = old[0..-2]
    end

    old
  end

end
