require 'timeliness'

class AudioRecording < ActiveRecord::Base
  extend Enumerize

  before_create :set_create_defaults
  # flex store
  store :notes

  # relations
  belongs_to :site
  has_many :audio_events
  belongs_to :user, :class_name => 'User', :foreign_key => :uploader_id
  has_many :analysis_items
  has_many :bookmarks
  # this is needed to be able to set a user object, rather than the user id
  belongs_to :uploader, class_name: 'User', foreign_key: :uploader_id

  # attr
  attr_accessible :bit_rate_bps, :channels, :data_length_bytes,
                  :duration_seconds, :file_hash, :media_type, :notes,
                  :recorded_date, :sample_rate_hertz, :status, :uploader_id,
                  :site_id, :uuid

  accepts_nested_attributes_for :site

  # userstamp
  acts_as_paranoid
  stampable
  belongs_to :user, class_name: 'User', foreign_key: :creator_id
  validates_as_paranoid

  #enums
  AVAILABLE_STATUSES = [:new, :to_check, :ready, :corrupt, :ignore].map { |item| item.to_s }
  enumerize :status, in: AVAILABLE_STATUSES, predicates: true
  validates :status, :inclusion => {in: AVAILABLE_STATUSES}, :presence => true

  # validation
  validates :uuid, :presence => true, :length => {:is => 36}, :uniqueness => {:case_sensitive => false}
  validates :uploader_id, :presence => true


  validates :recorded_date, :presence => true, :timeliness => {:on_or_before => lambda { Date.current }, :type => :date}
  validates :site, :presence => true
  validates :duration_seconds, :presence => true, :numericality => {greater_than_or_equal_to: 0}

  validates :sample_rate_hertz, :numericality => {only_integer: true, greater_than_or_equal_to: 0}

  # the channels field encodes our special version of a bit flag. 0 (no bits flipped) represents
  # a mix down option - we don't store mix downs (if we did they would be stored as single channel / mono (value = 1))
  validates :channels, :presence => true, :numericality => {:only_integer => true, :greater_than => 0}
  validates :bit_rate_bps, :numericality => {:only_integer => true, :greater_than_or_equal_to => 0}
  validates :media_type, :presence => true
  validates :data_length_bytes, :presence => true, :numericality => {:only_integer => true, :greater_than_or_equal_to => 0}

  validates :file_hash, :presence => true


  # uuid stuff
  attr_protected :uuid
  include UUIDHelper

  # http://stackoverflow.com/questions/11569940/inclusion-validation-fails-when-provided-a-symbol-instead-of-a-string
  # this lets a symbol be set, and it all still works
  def status=(new_status)
    super new_status.to_s
  end

  # scoped, re-usable queries
  # when chaining a lambda scope you must also wrap it with a
  # lambda or else you will end up with the wrong result
  # http://www.slashdotdash.net/2010/09/25/rails-3-scopes-with-chaining/
  #scope :recordings_from_projects, lambda { |project_ids| joins(:site) }
  #scope :filter_by_branch, lambda{|branch_id| includes(:branches).where(:branches => {:id => branch_id})

  # these need to be left outer joins. includes should do this, but does not.
  # use joins with the join in sql text :(
  # http://guides.rubyonrails.org/active_record_querying.html#specifying-conditions-on-eager-loaded-associations
  def self.recording_projects(project_ids)
    includes(:site => :projects).where(:projects => {:id => project_ids})
  end

  def self.recording_sites(site_ids)
    includes(:site).where(:sites => {:id => site_ids})
  end

  def self.recording_ids(recording_ids)
    where(:id => recording_ids)
  end

  def self.recording_uuids(recording_ids)
    where(:uuid => recording_ids)
  end

  # only one of these can be included.
  def self.recording_within_date(start_date, end_date)
    rel_query = scoped
    if start_date.kind_of?(DateTime)
      sqlite_calculation = "datetime(recorded_date, '+' || duration_seconds || ' seconds') >= :start_date"
      formatted_start_date = start_date.utc.midnight.strftime('%Y-%m-%d %H:%M:%S')
      rel_query = rel_query.where(sqlite_calculation, {:start_date => formatted_start_date})
    else
      raise ArgumentError, "Expected start_date to be a DateTime, given #{start_date.class} type."
    end

    if end_date.kind_of?(DateTime)
      formatted_end_date = end_date.utc.advance({days: 1}).midnight.strftime('%Y-%m-%d %H:%M:%S')
      rel_query = rel_query.where('recorded_date < :end_date', {:end_date => formatted_end_date})
    else
      raise ArgumentError, "Expected end_date to be a DateTime, given #{start_date.class} type."
    end

    rel_query
  end

  def self.recording_tags(tags)
    rel_query = includes(:audio_events => :tags)

    tags.each do |tag|
      rel_query = rel_query.where(Tag.arel_table[:text].matches("%#{tag}%"))
    end

    rel_query
  end

  def self.recording_time_ranges(time_ranges)
    raise ArgumentError, "Expected time ranges to be an array, got #{time_ranges.class} instead." unless time_ranges.kind_of?(Array)

    rel_query = scoped

    time_ranges.each do |range|
      range_start = range[0]
      range_end = range[1]

      formatted_start_time = range_start.utc.strftime('%H:%M:%S')
      formatted_end_time = range_end.utc.strftime('%H:%M:%S')

      if range_start < range_end
        # if start is less than end, the range is within one day
        sqlite_calculation = "datetime(recorded_date, '+' || duration_seconds || ' seconds') >= :start_date"
        rel_query.where(sqlite_calculation, {range_start: formatted_start_time, range_end: formatted_end_time})

      elsif range_start > range_end
        # if start is greater than end, the range goes over midnight (2 days)

      else
        # start and end are equal, ignore this range

      end

    end

    rel_query
  end

  private

  # default values
  def default_values
    # empty
  end

  def set_create_defaults
    self.status ||= 'new'
  end
end
