require 'common_attributes'

class AudioRecordingInSiteSerializer < CommonAttributesSerializer
  attributes :id, :name
end

class AudioRecordingSerializer < CommonAttributesSerializer
  attributes :id, :bit_rate_bps, :channels, :data_length_bytes,
             :duration_seconds, :file_hash, :media_type, :notes,
             :recorded_date, :sample_rate_hertz, :status, :uploader_id,
             :uuid

  has_one :site, :serializer => AudioRecordingInSiteSerializer
end


