module Audio
  
  @ffmpeg_path = "./vendor/bin/ffmpeg/windows/ffmpeg.exe"
  @ffprobe_path = "./vendor/bin/ffmpeg/windows/ffprobe.exe"
  @sox_path = "./vendor/bin/sox/windows/sox.exe"
  @wvunpack_path = "./vendor/bin/wavpack/windows/wvunpack.exe"
  @mp3splt_path = "./vendor/bin/mp3splt/windows/mp3splt.exe"
  
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
    # sox command to create a spectrogram from an audio file
    command = "#{@sox_path} #{@sox_arguments_verbose} \"#{source}\" #{@sox_arguments_output_audio} #{@sox_arguments_sample_rate} #{@sox_arguments_spectrogram} #{@sox_arguments_output} \"#{target}\""
    
    # run the command and wait for the result
    stdout_str, stderr_str, status = Open3.capture3(command)
    
    # package up all the available information and return it
    result = [ stdout_str, stderr_str, status, File.exist?(source), File.exist?(target) ]
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
      error.push ['SOX ERROR',sox_stderr_str]
    end
  end
  
  def self.ffprobe_info(source, info, error)
    ffprobe_arguments_info = "-sexagesimal -print_format default -show_error -show_streams -show_format"
    ffprobe_command = "#{@ffprobe_path} #{ffprobe_arguments_info} \"#{source}\""
    ffprobe_stdout_str, ffprobe_stderr_str, ffprobe_status = Open3.capture3(ffprobe_command)
    
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
  
end