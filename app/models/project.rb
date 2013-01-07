class Project < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  has_many :photos, :as => :imageable
  has_many :permissions, :as => :permissionable

  has_many :project_sites
  has_many :sites, :through => :project_sites

  accepts_nested_attributes_for :photos

  # attr
  # http://stackoverflow.com/questions/4934194/resulttype-614051528-expected-got-string-608366078-with-many-to-many-as
  attr_accessible :description, :name, :urn, :notes, :site_ids, :photos_attributes # :sites, :sites_attributes (those damn s's!)


  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id
  acts_as_paranoid
  validates_as_paranoid

  # validation
  validates :name, :presence => true, :uniqueness => { :case_sensitive => false }
  validates :urn, :presence => true, :uniqueness => { :case_sensitive => false }

  # commonly used queries (these return
  # ActiveRecord::Relation object which will allow for
  # further methods (such as other scopes) to be called on it)
  #scope :specified_projects, lambda { |project_ids| where('id in (:ids)',{:ids => project_ids}) }
  #scope :project_sites, lambda { |project_ids| includes(:sites).where('id in (:ids)',{:ids => project_ids}) }
  scope :project_sites, lambda{|site_ids| includes(:sites).where(:sites => {:id => site_ids}) }

end
