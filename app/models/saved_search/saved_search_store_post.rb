class SavedSearchStorePost
  include ActiveModel::Validations

  attr_accessor :display_tags_species, :display_tags_common,
                :display_tags_looks_like, :display_tags_sounds_like,
                :display_tags_reference, :display_tags_auto

  def to_s
    self.to_json
  end

end