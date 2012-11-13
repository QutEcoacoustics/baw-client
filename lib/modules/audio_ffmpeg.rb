module AudioFfmpeg
  include OS
  @ffmpeg_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffmpeg.exe" else "ffmpeg" end
  @ffprobe_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffprobe.exe" else "ffprobe" end

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

    Rails.logger.debug "Ffprobe info return status #{ffprobe_status.exitstatus}. Command: #{ffprobe_command}"

    if ffprobe_status.exitstatus == 0
      result[:info][:ffmpeg] = parse_ffprobe_output(ffprobe_stdout_str)
    else
      Rails.logger.debug "Ffprobe info error. Return status #{ffprobe_status.exitstatus}. Command: #{ffprobe_command}"
      result[:error][:ffmpeg] = parse_ffprobe_output(ffprobe_stdout_str)
    end

    if result[:info][:ffmpeg]['FFPROBE STREAM codec_type'] != 'audio'
      result[:error][:ffmpeg][:file_type] = 'Not an audio file.'
      Rails.logger.debug "Ffprobe gave info about a non-audio file."

    end

    result
  end

  def self.modify_ffmpeg(source, target, modify_parameters = {})
    ffprobe_arguments_info = "-sexagesimal -print_format default -show_error -show_streams -show_format"
    ffprobe_command = "#@ffprobe_path #{ffprobe_arguments_info} \"#{source}\""
    ffprobe_stdout_str, ffprobe_stderr_str, ffprobe_status = Open3.capture3(ffprobe_command)

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