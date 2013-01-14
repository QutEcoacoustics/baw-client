class AnalysisScript < ActiveRecord::Base
  # flex store
  store :notes

  # attr
  attr_accessible :description,
                  :display_name,  # the original name
                  :extra_data,
                  :name,          # a filesystem safe version of display_name
                  :settings,
                  :version,
                  :notes,
                  :verified

  # userstamp
  stampable
  belongs_to :user, :class_name => 'User', :foreign_key => :creator_id
  acts_as_paranoid
  validates_as_paranoid

  # validations
  validates :name, presence: true, length: {minimum: 2, maximum: 100}, uniqueness: {case_sensitive: false}
  validates :display_name, presence: true
  validates :settings, presence: true
  validates :version, presence: true
  validates :display_name, presence: true
  validates :verified, inclusion: {in: [true, false]}

end
