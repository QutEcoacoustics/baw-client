module Audio
  include AudioSox, AudioMp3splt, AudioWavpack, AudioFfmpeg

  # Provides information about an audio file.
  def self.info(source)

    info = []
    error = []

    info_sox source, info, error
    info_ffmpeg source, info, error
    info_wavpack source, info, error

    # return the packaged info array
    [ info, error ]
  end

  # Creates a new audio file from source path in target path, modified according to the
  # parameters in modify_parameters
  def self.modify(source, target, modify_parameters)
    modify_wavpack(source, target, modify_parameters)
  end

end