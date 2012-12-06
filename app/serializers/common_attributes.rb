class CommonAttributesSerializer < ActiveModel::Serializer
  attributes :created_at,
             :creator_id,
             :deleted_at,
             :deleter_id,
             :updated_at,
             :updater_id

  def include_deleted_at?
    object.respond_to? :deleted_at
  end

  def include_deleter_id?
    object.respond_to? :deleted_id
  end
end

