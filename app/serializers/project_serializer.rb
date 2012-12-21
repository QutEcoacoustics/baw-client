require 'common_attributes'

class SitesInProjectSerializer < CommonAttributesSerializer
  attributes :id, :name
end

class PhotosInProjectSerializer < CommonAttributesSerializer
  attributes :id, :description, :uri, :copyright
end


class ProjectSerializer < CommonAttributesSerializer
  attributes :id, :name, :description, :urn, :notes

  has_many :sites, :serializer => SitesInProjectSerializer
  has_many :photos, :serializer => PhotosInProjectSerializer
end