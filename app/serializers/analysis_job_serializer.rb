
class AnalysisJobSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :notes, :script_name, :script_version, :script_description, :script_settings, :script_display_name, :script_extra_data, :data_set_identifier

  #has_one :saved_search

end

