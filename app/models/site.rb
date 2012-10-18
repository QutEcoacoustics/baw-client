class Site < ActiveRecord::Base
  store :notes
  attr_accessible :name, :latitude, :longitude, :notes
  has_many :photos, :as => :imageable
  has_many :projects_sites
  has_many :projects, :through => :projects_sites
  
  validates :name, :presence => true, :length => { :minimum => 2 }
  validates :latitude, :presence => true, :numericality => true
  validates :longitude, :presence => true, :numericality => true
end
