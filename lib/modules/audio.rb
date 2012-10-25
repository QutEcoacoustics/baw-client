require 'OS'

module Audio
  
  @ffmpeg_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffmpeg.exe" else "ffmpeg" end
  @ffprobe_path = if OS.windows? then "./vendor/bin/ffmpeg/windows/ffprobe.exe" else "ffprobe" end
  @sox_path = if OS.windows? then "./vendor/bin/sox/windows/sox.exe" else "sox" end
  @wvunpack_path = if OS.windows? then "./vendor/bin/wavpack/windows/wvunpack.exe" else "wvunpack" end
  @mp3splt_path = if OS.windows? then "./vendor/bin/mp3splt/windows/mp3splt.exe" else "mp3splt" end
  
  @@my_logger ||= Logger.new("#{Rails.root}/log/my.log")
  
  # public methods
  public
  
  # Provides information about an audio file.
  def self.info(source)

    info = []
    error = []
    
    sox_info source, info, error
    ffprobe_info source, info, error
    wvunpack_info source, info, error
    
    # return the packaged info array
    [ info, error ]
  end
  
  # Creates a new audio file from source path in target path, modified according to the
  # parameters in modify_parameters
  def self.modify(source, target, modify_parameters)
    wvunpack(source, target, modify_parameters)
  end
  
  # private methods
  private
  
  def self.sox_info(source, info, error)
    sox_arguments_info = "--info"
    sox_command = "#{@sox_path} #{sox_arguments_info} \"#{source}\"" # commands to get info from audio file
    sox_stdout_str, sox_stderr_str, sox_status = Open3.capture3(sox_command) # run the commands and wait for the result
    
    if sox_status.exitstatus == 0
      # sox std out contains info (separate on first colon(:))
      sox_stdout_str.strip.split(/\r?\n|\r/).each { |line| info.push [ 'SOX ' + line[0,line.index(':')].strip, line[line.index(':')+1,line.length].strip ] }
      # sox_stderr_str is empty
    else
      Rails.logger.debug "Sox info error. Return status #{sox_status.exitstatus}. Command: #{sox_command}"
      error.push ['SOX ERROR',sox_stderr_str]
    end
  end
  
  def self.ffprobe_info(source, info, error)
    ffprobe_arguments_info = "-sexagesimal -print_format default -show_error -show_streams -show_format"
    ffprobe_command = "#{@ffprobe_path} #{ffprobe_arguments_info} \"#{source}\""
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
  end
  
  def self.wvunpack_info(source, info, error)
    wvunpack_arguments_info = "-s"
    wvunpack_command = "#{@wvunpack_path} #{wvunpack_arguments_info} \"#{source}\"" # commands to get info from audio file
    wvunpack_stdout_str, wvunpack_stderr_str, wvunpack_status = Open3.capture3(wvunpack_command) # run the commands and wait for the result
    
    Rails.logger.debug "Wavpack info return status #{wvunpack_status.exitstatus}. Command: #{wvunpack_command}"
    
    if wvunpack_status.exitstatus == 0
      # wvunpack std out contains info (separate on first colon(:))
      wvunpack_stdout_str.strip.split(/\r?\n|\r/).each do |line|
        line.strip!
        current_key = line[0,line.index(':')].strip
        current_value = line[line.index(':')+1,line.length].strip
        info.push [ 'WVUNPACK ' + current_key, current_value ]
      end
      
      # wvunpack_stderr_str contains human-formatted info and errors
    else
      info.push [ 'WVUNPACK ERROR', wvunpack_stderr_str.strip!.split(/\r?\n|\r/).last ]
    end
  end
  
  # wvunpack converts .wv files to .wav, optionally segmenting them
  # target should be calculated based on modify_parameters by cache module
  # modify_parameters can contain start_offset (fractions of seconds from start) and/or end_offset (fractions of seconds from start)
  def self.wvunpack(source, target, modify_parameters = {})
    raise ArgumentError, "Source is not a wavpack file: #{File.basename(source)}" unless source.match(/\.wv$/)
    raise ArgumentError, "Target is not a wav file: : #{File.basename(target)}" unless target.match(/\.wav$/)
    raise ArgumentError, "Source does not exist: #{File.basename(source)}" unless File.exists? source
    raise ArgumentError, "Target exists: #{File.basename(target)}" unless !File.exists? source
    
    # formatted time: hh:mm:ss.ss
    arguments = '-t -q'
    if modify_parameters.include? :start_offset
      start_offset_formatted = Time.at(modify_parameters[:start_offset]).utc.strftime('%H:%M:%S.%2N')
      arguments += ' --skip=#{start_offset_formatted}'
    end
    
    if modify_parameters.include? :end_offset
      end_offset_formatted = Time.at(modify_parameters[:start_offset]).utc.strftime('%H:%M:%S.%2N')
      arguments += ' --until=#{end_offset_formatted}'
    end
    
    wvunpack_command = "#{@wvunpack_path} #{arguments} \"#{source}\" \"#{target}\"" # commands to get info from audio file
    wvunpack_stdout_str, wvunpack_stderr_str, wvunpack_status = Open3.capture3(wvunpack_command) # run the commands and wait for the result
    
    if wvunpack_status.exitstatus == 0
      raise "Wvunpack exited with an error: #{wvunpack_stderr_str}"
    end
  end
  
end