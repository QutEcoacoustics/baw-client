require 'timeliness'

class AudioRecording < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  belongs_to :site
  has_many :audio_events
  belongs_to :user, :class_name => 'User', :foreign_key => "uploader_id"

  # attr
  attr_accessible :bit_rate_bps, :channels, :data_length_bytes,
                  :duration_seconds, :file_hash, :media_type, :notes,
                  :recorded_date, :sample_rate_hertz, :status, :uploader_id,
                  :site_id

  accepts_nested_attributes_for :site

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id
  acts_as_paranoid
  validates_as_paranoid

  # validation
  validates :uuid, :presence => true, :length =>  {:is => 36}, :uniqueness => { :case_sensitive => false }
  validates :uploader_id, :presence => true
  

  validates :recorded_date, :presence => true, :timeliness => {:on_or_before => lambda { Date.current }, :type => :date }
  validates :site, :presence => true
  validates :duration_seconds, :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }

  validates :sample_rate_hertz, :numericality => { :only_integer => true, :greater_than_or_equal_to => 0 }

  # the channels field encodes our special version of a bit flag. 0 (no bits flipped) represents
  # a mix down option - we don't store mix downs (if we did they would be stored as single channel / mono (value = 1))
  validates :channels, :presence => true, :numericality => { :only_integer => true, :greater_than => 0 }
  validates :bit_rate_bps, :numericality => { :only_integer => true, :greater_than_or_equal_to => 0 }
  validates :media_type, :presence => true
  validates :data_length_bytes, :presence => true, :numericality => { :only_integer => true, :greater_than_or_equal_to => 0 }

  validates :file_hash, :presence => true

  # uuid stuff
  attr_protected :uuid
  include UUIDHelper

  # scoped, re-usable queries
  # when chaining a lambda scope you must also wrap it with a
  # lambda or else you will end up with the wrong result
  # http://www.slashdotdash.net/2010/09/25/rails-3-scopes-with-chaining/
  #scope :recordings_from_projects, lambda { |project_ids| joins(:site) }
  #scope :filter_by_branch, lambda{|branch_id| includes(:branches).where(:branches => {:id => branch_id})

  # these need ot be left outer joins. includes should do this, ut does not.
  # use joins with the join in sql text :(
  # http://guides.rubyonrails.org/active_record_querying.html#specifying-conditions-on-eager-loaded-associations
  def self.recording_projects(project_ids)
    includes(:site => :projects).where(:projects => { :id => project_ids})
  end

  def self.recording_sites(site_ids)
    includes(:site).where(:sites => { :id => site_ids })
  end

  def self.recordings(recording_ids)
    where(:id => recording_ids)
  end

  # only one of these can be included.
  def self.recording_within_date(start_date, end_date)
    rel_query = scoped
    if start_date.is_a?(Time)
      rel_query = rel_query.where('recorded_date + duration_seconds >= :start_date', {:start_date => start_date})
    end

    if end_date.is_a?(Time)
      rel_query = rel_query.where('recorded_date <= :end_date', {:end_date => end_date})
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
    scoped
  end

  private

  # default values
  def default_values
    # empty
  end
end
