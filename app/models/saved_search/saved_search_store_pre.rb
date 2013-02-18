class SavedSearchStorePre
  include ActiveModel::Validations

  attr_accessor :created_by_id, :is_temporary

  validates :created_by_id, numericality: {only_integer: true, greater_than_or_equal_to: 1}, allow_nil: true
  validates :is_temporary, :inclusion => {:in => [true, false]}, allow_nil: true

  def to_s
    self.to_json
=begin
    msg = 'Saved Search Store Pre'
    unless @created_by_id.blank?
    msg = msg + " created by user with id #@created_by_id"
    end

    unless @is_temporary.blank?
      msg = msg + " is #{@is_temporary ? '' : 'not'} temporary"
      end
    msg
=end
  end
end