class Site < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  has_many :photos, :as => :imageable

  has_many :project_sites
  has_many :projects, :through => :project_sites

  has_many :audio_recordings

  # attr
  attr_accessible :name, :latitude, :longitude, :notes

  accepts_nested_attributes_for :audio_recordings

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id
  acts_as_paranoid
  validates_as_paranoid

  # validations
  validates :name, :presence => true, :length => { :minimum => 2 }
  validates :latitude, :numericality => true
  validates :longitude, :numericality => true
end
