class Photo < ActiveRecord::Base
  belongs_to :imageable, :polymorphic => true
  attr_accessible :copyright, :uri, :description, :imageable_type, :imageable_id
  
  # http://stackoverflow.com/questions/6778269/rails-3-polymorphic-liking-of-entities-by-user-how
  # http://stackoverflow.com/questions/746387/labels-for-radio-buttons-in-rails-form
  validates :uri, :presence => true
  validates_format_of :uri, :with => URI::regexp(%w(http https))
  validates :copyright, :presence => true
  
  
end
