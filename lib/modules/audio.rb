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
    raise ArgumentError, "Source does not exist: #{File.basename(source)}" unless File.exists? source
    raise ArgumentError, "Target exists: #{File.basename(target)}" unless !File.exists? source
    raise ArgumentError "Source and Target are the same file." unless source != target

    if source.match(/\.wv$/)
      # wav pack can only be converted to wav

      target_file = Cache::cached_audio_file modify_parameters
      target_possible_paths = Cache::possible_paths(Cache::cached_audio_storage_paths,target_file)

      AudioWavpack::modify_wavpack(source, target, modify_parameters)
    end
  end

end