class SavedSearchStorePre
  include ActiveModel::Validations

  validates :created_by_id, numericality: {only_integer: true, greater_than_or_equal_to: 1}, allow_nil: true
  validates :is_temporary, :inclusion => { :in => [true, false] }, allow_nil: true


end