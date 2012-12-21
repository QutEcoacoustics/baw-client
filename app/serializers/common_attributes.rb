class CommonAttributesSerializer < ActiveModel::Serializer
  attributes :created_at,
             :creator_id,
             :deleted_at,
             :deleter_id,
             :updated_at,
             :updater_id

  def include_deleted_at?
    object.respond_to?(:deleted_at) && !object.deleted_at.blank?
  end

  def include_deleter_id?
    object.respond_to?(:deleted_id) && !object.deleted_id.blank?
  end

  def include_updated_at?
    object.respond_to? :updated_at
  end

  def include_updater_id?
    object.respond_to? :updater_id
  end

  def include_created_at
    object.respond_to? :created_at
  end

  def include_creator_id?
    object.respond_to? :creator_id
  end
end

