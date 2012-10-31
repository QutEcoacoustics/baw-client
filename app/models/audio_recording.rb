require 'timeliness'

class AudioRecording < ActiveRecord::Base
  store :notes
  belongs_to :user
  belongs_to :site
  attr_accessible :bit_rate_bps, :channels, :data_length_bytes,
                  :duration_seconds, :hash, :media_type, :notes,
                  :recorded_date, :sample_rate_hertz, :status

  stampable
  acts_as_paranoid

  # validation
  validates :uuid, :presence => true, :length =>  {:is => 36}
  validates :user, :presence => true

  validates :recorded_date, :presence => true, :on_or_before => :now
  validates :site, :presence => true
  validates :duration_seconds, :presence => true, :numericality => { :greater_than_or_equal_to  => 0 }

  validates :sample_rate_hertz, :numericality => { :only_integer => true, :greater_than => 0 }
  validates :channels, :presence => true, :numericality => { :only_integer => true, :greater_than => 0 }
  validates :bit_rate_bps, :numericality => { :only_integer => true, :greater_than => 0 }
  validates :media_type, :presence => true
  validates :data_length_bytes, :presence => true, :numericality => { :only_integer => true, :greater_than_or_equal_to => 0 }

  validates :hash, :presence => true


  # uuid stuff
  attr_protected :uuid
  validates_presence_of :uuid
  validates_uniqueness_of :uuid

  include UUIDHelper

end
