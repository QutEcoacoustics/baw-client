
class AnalysisScriptSerializer < ActiveModel::Serializer
  attributes :id, :name, :version, :description, :settings, :display_name, :extra_data

end

