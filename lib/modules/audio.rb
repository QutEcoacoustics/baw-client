require 'open3'
require './lib/modules/string'

module Audio
  include AudioSox, AudioMp3splt, AudioWavpack, AudioFfmpeg

  # @return Path to a file. The file does not exist.
  def self.temp_file(extension)
    path = Rails.root.join('tmp', SecureRandom.hex(7)+'.'+extension.trim('.','')).to_s
    path
  end

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
      raise ArgumentError, "Source must be a wavpack file: #{File.basename(source)}." unless source.match(/\.wv$/)
      raise ArgumentError, "Target must be a wav file: #{File.basename(target)}." unless  target.match(/\.wav$/)
      raise ArgumentError, "Target must be a wav file, given #{modify_parameters[:format]}." unless modify_parameters[:format] == 'wav'

      AudioWavpack::modify_wavpack(source, target, modify_parameters)

    elsif source.match(/\.wv$/) && target.match(/\.mp3$/)

      # put the wav file in a temp location
      temp_wav_file = temp_file('wav')
      AudioWavpack::modify_wavpack(source, temp_wav_file, modify_parameters)

      # remove start and end offset from modify_parameters (otherwise it will be done again!)
      wav_to_mp3_modify_params = modify_parameters.clone
      wav_to_mp3_modify_params.delete :start_offset
      wav_to_mp3_modify_params.delete :end_offset

      AudioSox::modify_sox(temp_wav_file, target, wav_to_mp3_modify_params)

    elsif source.match(/\.wav$/)&& target.match(/\.mp3$/)

      AudioSox::modify_sox(source, target, modify_parameters)

    elsif source.match(/\.mp3$/) && target.match(/\.mp3$/)

      AudioSox::modify_sox(source, target, modify_parameters)

    else

      AudioFfmpeg::modify_ffmpeg(source, target, modify_parameters)

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
    #cached_wav_audio_parameters = modify_parameters.clone
    #cached_wav_audio_parameters[:format] = 'wav'


  end

  # can do any required modifications (using sox or ffmpeg)
  def self.modify_wav_mp3(source, target, modify_parameters)

  end


end
