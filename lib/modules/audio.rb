require 'open3'

module Audio
  include AudioSox, AudioMp3splt, AudioWavpack, AudioFfmpeg

  # Provides information about an audio file.
  def self.info(source)

    result = {}

    sox = AudioSox::info_sox source
    result = result.deep_merge sox

    ffmpeg = AudioFfmpeg::info_ffmpeg source
    result = result.deep_merge  ffmpeg

    wavpack = AudioWavpack::info_wavpack source
    result = result.deep_merge wavpack

    # return the packaged info array
    result
  end

  # Creates a new audio file from source path in target path, modified according to the
  # parameters in modify_parameters. Possible options:
  # :start_offset :end_offset :channel :sample_rate :format
  def self.modify(source, target, modify_parameters)
    raise ArgumentError, "Source does not exist: #{File.basename(source)}" unless File.exists? source
    raise ArgumentError, "Target exists: #{File.basename(target)}" unless !File.exists? target
    raise ArgumentError "Source and Target are the same file." unless source != target

    if source.match(/\.wv$/)
      # wav pack can only be converted to wav
      cached_wav_audio_parameters = modify_parameters.clone
      cached_wav_audio_parameters[:format] = 'wav'

      target_file = Cache::cached_audio_file cached_wav_audio_parameters
      target_possible_paths = Cache::possible_paths(Cache::cached_audio_storage_paths,target_file)

      AudioWavpack::modify_wavpack(source, target_possible_paths.first, modify_parameters)
    end

  end

end