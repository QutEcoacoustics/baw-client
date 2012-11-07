class Project < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  has_many :photos, :as => :imageable
  has_many :permissions, :as => :permissionable

  has_many :project_sites
  has_many :sites, :through => :project_sites

  accepts_nested_attributes_for :sites

  # attr
  # http://stackoverflow.com/questions/4934194/resulttype-614051528-expected-got-string-608366078-with-many-to-many-as
  attr_accessible :description, :name, :urn, :notes, :sites, :sites_attributes, :site_ids

  # userstamp
  stampable
  belongs_to :user
  acts_as_paranoid
  validates_as_paranoid

  # validation
  validates :name, :presence => true, :uniqueness => { :case_sensitive => false }
  validates :urn, :presence => true

end
