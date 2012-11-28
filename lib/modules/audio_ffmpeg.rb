require './lib/modules/logger'

module AudioFfmpeg
  include OS, Logging
  @ffmpeg_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffmpeg.exe" else "ffmpeg" end
  @ffprobe_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffprobe.exe" else "ffprobe" end

  # constants
  CODECS = {
      :wav => {
          :codec_name => 'pcm_s16le',
          :codec_long_name => 'PCM signed 16-bit little-endian',
          :codec_type => 'audio',
          :format_long_name => 'WAV / WAVE (Waveform Audio)'
      },
      :mp3 => {
          :codec_name => 'mp3',
          :codec_long_name => 'MP3 (MPEG audio layer 3)',
          :codec_type => 'audio',
          :format_long_name => 'MP2/3 (MPEG audio layer 2/3)'
      }
  }

  # public methods
  public

  def self.info_ffmpeg(source)
    result = {
        :info => { :ffmpeg => {} },
        :error => { :ffmpeg => {} }
    }
    ffprobe_arguments_info = "-sexagesimal -print_format default -show_error -show_streams -show_format"
    ffprobe_command = "#@ffprobe_path #{ffprobe_arguments_info} \"#{source}\""
    ffprobe_stdout_str, ffprobe_stderr_str, ffprobe_status = Open3.capture3(ffprobe_command)

    Logging::logger.debug "Ffprobe info return status #{ffprobe_status.exitstatus}. Command: #{ffprobe_command}"

    if ffprobe_status.exitstatus == 0
      result[:info][:ffmpeg] = parse_ffprobe_output(ffprobe_stdout_str)
    else
      result[:error][:ffmpeg] = parse_ffprobe_output(ffprobe_stdout_str)
      Logging::logger.error "Ffprobe info error. Return status #{ffprobe_status.exitstatus}. Information: #{result[:error][:ffmpeg]}"
    end

    if result[:info][:ffmpeg]['STREAM codec_type'] != 'audio'
      result[:error][:ffmpeg][:file_type] = 'Not an audio file.'
      Logging::logger.warn "Ffprobe gave info about a non-audio file: #{result[:info][:ffmpeg]['STREAM codec_type']}"
    end

    result
  end

  def self.modify_ffmpeg(source, target, modify_parameters = {})
    ffprobe_arguments_info = "-sexagesimal -print_format default -show_error -show_streams -show_format"
    ffprobe_command = "#@ffprobe_path #{ffprobe_arguments_info} \"#{source}\""
    ffprobe_stdout_str, ffprobe_stderr_str, ffprobe_status = Open3.capture3(ffprobe_command)

  end

  # returns the duration in seconds (and fractions if present)
  def self.parse_duration(duration_string)
    duration_match = /(?<hour>\d+):(?<minute>\d+):(?<second>[\d+\.]+)/i.match(duration_string)
    duration = 0
    if !duration_match.nil? && duration_match.size == 4
      duration = (duration_match[:hour].to_f * 60 * 60) + (duration_match[:minute].to_f * 60) + duration_match[:second].to_f
    end
    duration
  end

  private

  def self.parse_ffprobe_output(raw)
    # ffprobe std err contains info (separate on first equals(=))
    result = {}
    ffprobe_current_block_name = ''
    raw.strip.split(/\r?\n|\r/).each do |line|
      line.strip!
      if line[0] == '['
        # this chomp reverse stuff is due to the lack of a proper 'trim'
        ffprobe_current_block_name = line.chomp(']').reverse.chomp('[').reverse
      else
        current_key = line[0,line.index('=')].strip
        current_value = line[line.index('=')+1,line.length].strip
        result[ffprobe_current_block_name + ' ' + current_key] = current_value
      end
    end

    result
  end

end