require 'common_attributes'

class AnalysisScriptSerializer < CommonAttributesSerializer
  attributes :id, :name, :version, :description, :settings, :display_name, :extra_data

end

