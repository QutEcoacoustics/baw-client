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
  belongs_to :user
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

  private

  # default values
  def default_values
    # empty
  end
end
