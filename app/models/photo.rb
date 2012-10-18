class Photo < ActiveRecord::Base
  belongs_to :imageable, :polymorphic => true
  attr_accessible :copyright, :uri, :description
  
  validates :uri, :presence => true
  validates_format_of :uri, :with => URI::regexp(%w(http https))
  validates :copyright, :presence => true
end
