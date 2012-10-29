module AudioFfmpeg
  include OS
  @ffmpeg_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffmpeg.exe" else "ffmpeg" end
  @ffprobe_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffprobe.exe" else "ffprobe" end

  # public methods
  public


  def self.info_ffmpeg(source)
    info = []
    error = []
    ffprobe_arguments_info = "-sexagesimal -print_format default -show_error -show_streams -show_format"
    ffprobe_command = "#{@ffprobe_path.to_s} #{ffprobe_arguments_info} \"#{source}\""
    ffprobe_stdout_str, ffprobe_stderr_str, ffprobe_status = Open3.capture3(ffprobe_command)

    Rails.logger.debug "Ffprobe info return status #{ffprobe_status.exitstatus}. Command: #{ffprobe_command}"

    if ffprobe_status.exitstatus == 0
      # ffprobe std out contains info (separate on first equals(=))
      # ffprobe_stderr_str contains progress info and human-formatted info
      ffprobe_current_block_name = ''
      ffprobe_stdout_str.strip.split(/\r?\n|\r/).each do |line|
        line.strip!
        if line[0] == '['
          # this chomp reverse stuff is due to the lack of a proper 'trim'
          ffprobe_current_block_name = line.chomp(']').reverse.chomp('[').reverse
        else
          current_key = line[0,line.index('=')].strip
          current_value = line[line.index('=')+1,line.length].strip
          info.push [ 'FFPROBE ' + ffprobe_current_block_name + ' ' + current_key, current_value ]
        end
      end
    else
      Rails.logger.debug "Ffprobe info error. Return status #{ffprobe_status.exitstatus}. Command: #{ffprobe_command}"
      # ffprobe std err contains info (separate on first equals(=))
      ffprobe_current_block_name = ''
      ffprobe_stdout_str.strip.split(/\r?\n|\r/).each do |line|
        line.strip!
        if line[0] == '['
          # this chomp reverse stuff is due to the lack of a proper 'trim'
          ffprobe_current_block_name = line.chomp(']').reverse.chomp('[').reverse
        else
          current_key = line[0,line.index('=')].strip
          current_value = line[line.index('=')+1,line.length].strip
          error.push [ 'FFPROBE ' + ffprobe_current_block_name + ' ' + current_key, current_value ]
        end
      end
    end

    [ info, error ]
  end

  def self.modify_ffmpeg(source, target, modify_parameters = {})
    info = []
    error = []
    ffprobe_arguments_info = "-sexagesimal -print_format default -show_error -show_streams -show_format"
    ffprobe_command = "#{@ffprobe_path.to_s} #{ffprobe_arguments_info} \"#{source}\""
    ffprobe_stdout_str, ffprobe_stderr_str, ffprobe_status = Open3.capture3(ffprobe_command)
  end
end