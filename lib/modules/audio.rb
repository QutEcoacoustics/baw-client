module Audio
  include AudioSox, AudioMp3splt, AudioWavpack, AudioFfmpeg

  # Provides information about an audio file.
  def self.info(source)

    info = []
    error = []

    sox = AudioSox::info_sox source
    info.concat sox[0]
    error.concat sox[1]

    ffmpeg = AudioFfmpeg::info_ffmpeg source
    info.concat ffmpeg[0]
    error.concat ffmpeg[1]

    wavpack = AudioWavpack::info_wavpack source
    info.concat wavpack[0]
    error.concat wavpack[1]

    # return the packaged info array
    [ info, error ]
  end

  # Creates a new audio file from source path in target path, modified according to the
  # parameters in modify_parameters. Possible options:
  # :start_offset :end_offset :channel :sample_rate :format
  def self.modify(source, target, modify_parameters)

    modify_wavpack(source, target, modify_parameters)
  end

end