class Project < ActiveRecord::Base
  store :notes
  # http://stackoverflow.com/questions/4934194/resulttype-614051528-expected-got-string-608366078-with-many-to-many-as
  attr_accessible :description, :name, :urn, :notes, :sites, :sites_attributes, :site_ids
  has_many :photos, :as => :imageable
  has_many :project_sites
  has_many :sites, :through => :project_sites
  accepts_nested_attributes_for :sites
  
  validates :name, :presence => true
end
