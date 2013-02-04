class AnalysisJob < ActiveRecord::Base
  # flex store
  store :notes

  # relations
  belongs_to :saved_search
  has_many :analysis_items

  # attr
  attr_accessible :description, :name, :notes, :process_new,
                  # a generated identifier from an ?executed? saved search - this might be a file name
                  :data_set_identifier,

                  # this is a copy of the information from the analysis_scripts table
                  # duplicated to create a instance snap-shot of the data that will not change
                  :script_description, :script_display_name, :script_extra_data, :script_name,
                  :script_settings, :script_version, :saved_search_id


  accepts_nested_attributes_for :saved_search

  # userstamp
  acts_as_paranoid
  stampable
  belongs_to :user, class_name: 'User', foreign_key: :creator_id
  validates_as_paranoid

  # validations
  validates :name, presence: true, length: { minimum: 2, maximum: 255 }, uniqueness: { case_sensitive: false }

  validates :script_name, :presence => true
  validates :script_settings, :presence => true
  validates :script_version, :presence => true
  validates :script_display_name, :presence => true

  validates :process_new, :inclusion => { :in => [true, false] }, allow_nil: true
  validate :data_set_cannot_process_new

  # custom validation methods
  def data_set_cannot_process_new
    return if process_new.nil?

    errors.add(:level, 'An analysis job that references a data set cannot process new recordings.') if self.data_set_identifier && self.process_new
  end
end
