require 'open3'

module Audio
  include AudioSox, AudioMp3splt, AudioWavpack, AudioFfmpeg

  # Provides information about an audio file.
  def self.info(source)

    result = {}

    sox = AudioSox::info_sox source
    result = result.deep_merge sox

    ffmpeg = AudioFfmpeg::info_ffmpeg source
    result = result.deep_merge ffmpeg

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

    if source.match(/\.wv$/) && target.match(/\.wav$/)

      modify_wv_wav(source, target, modify_parameters)

    elsif source.match(/\.wv$/) && target.match(/\.mp3$/)

      # use cache to place intermediate file in the right place?
      modify_wv_wav(source, target, modify_parameters)
      # remove start and end offset from modify_parameters (otherwise it will be done again!)
      modify_wav_mp3(target, target, modify_parameters)

    elsif source.match(/\.wav$/)&& target.match(/\.mp3$/)

      modify_wav_mp3(target, target, modify_parameters)

    elsif source..match(/\.mp3$/) && target.match(/\.mp3$/)

      modify_mp3_mp3(source, target, modify_parameters)

    else

      AudioFfmpeg::modify_ffmpeg(target, target, modify_parameters)

    end

  end

  # uses mp3splt, can only do segmenting
  def self.modify_mp3_mp3(source, target, modify_parameters)

  end

  private

  # only does conversion to wav, and optional segmenting
  def self.modify_wv_wav(source, target, modify_parameters)
    raise ArgumentError, "Source must be a wavpack file: #{File.basename(source)}" unless source.match(/\.wv$/)
    raise ArgumentError, "Target must be a wav file: #{File.basename(target)}" unless  target.match(/\.wav$/)

    # wav pack can only be converted to wav
    cached_wav_audio_parameters = modify_parameters.clone
    cached_wav_audio_parameters[:format] = 'wav'

    target_file = Cache::cached_audio_file cached_wav_audio_parameters
    target_possible_paths = Cache::possible_paths(Cache::cached_audio_storage_paths,target_file)

    AudioWavpack::modify_wavpack(source, target_possible_paths.first, modify_parameters)
  end

  # can do any required modifications (using sox or ffmpeg)
  def self.modify_wav_mp3(source, target, modify_parameters)

  end


end
