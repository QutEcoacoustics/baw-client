require 'common_attributes'

class ProjectsInSiteSerializer < CommonAttributesSerializer
  attributes :id, :name
end

class PhotosInSiteSerializer < CommonAttributesSerializer
  attributes :id, :description, :uri, :copyright
end

class AudioRecordingsInSiteSerializer < CommonAttributesSerializer
  attributes :id, :uuid, :duration_seconds, :status
end

class SiteSerializer < CommonAttributesSerializer
  attributes :id, :name, :latitude, :longitude, :notes

  has_many :projects, :serializer => ProjectsInSiteSerializer
  has_many :photos, :serializer => PhotosInSiteSerializer
  #has_many :audio_recordings, :serializer => AudioRecordingsInSiteSerializer

end


