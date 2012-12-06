


class AudioRecordingSerializer < CommonAttributesSerializer
  attributes :bit_rate_bps, :channels, :data_length_bytes,
             :duration_seconds, :file_hash, :media_type, :notes,
             :recorded_date, :sample_rate_hertz, :status, :uploader_id,
             :site_id, :uuid, :id


end


