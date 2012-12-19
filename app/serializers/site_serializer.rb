require 'common_attributes'

class SiteSerializer < CommonAttributesSerializer
  attributes :id, :name, :latitude, :longitude, :notes

end