class AnalysisJob < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  belongs_to :saved_search

  # attr
  attr_accessible :data_set_identifier, :description, :name, :notes,
                  :script_description, :script_display_name, :script_extra_data, :script_name,
                  :script_settings, :script_version,
                  :process_new

  accepts_nested_attributes_for :saved_search

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id

  # validations
  validates :name, :presence => true, :length => { :minimum => 2, :maximum => 100 }, :uniqueness => { :case_sensitive => false }
  validates :script_name, :presence => true
  validates :script_settings, :presence => true
  validates :script_version, :presence => true
  validates :script_display_name, :presence => true
  validates :process_new, :inclusion => { :in => %w(true false) }
  validate :data_set_cannot_process_new

  # custom validation methods
  def data_set_cannot_process_new
    errors.add(:level, "An analysis job that references a data set cannot process new recordings.") if self.data_set_identifier && self.process_new
  end
end
