module AudioSox
  include OS
  @sox_path = if OS.windows? then "./vendor/bin/sox/windows/sox.exe" else "sox" end

  # public methods
  public

  def self.info_sox(source)
    info = []
    error = []

    sox_arguments_info = "--info"
    sox_command = "#{@sox_path.to_s} #{sox_arguments_info} \"#{source}\"" # commands to get info from audio file
    sox_stdout_str, sox_stderr_str, sox_status = Open3.capture3(sox_command) # run the commands and wait for the result

    if sox_status.exitstatus == 0
      # sox std out contains info (separate on first colon(:))
      sox_stdout_str.strip.split(/\r?\n|\r/).each { |line| info.push [ 'SOX ' + line[0,line.index(':')].strip, line[line.index(':')+1,line.length].strip ] }
      # sox_stderr_str is empty
    else
      Rails.logger.debug "Sox info error. Return status #{sox_status.exitstatus}. Command: #{sox_command}"
      error.push ['SOX ERROR',sox_stderr_str]
    end

    [info, error]
  end

  def self.modify_sox(source, target, modify_parameters = {})

    info = []
    error = []

    sox_arguments_info = "--info"
    sox_command = "#{@sox_path.to_s} #{sox_arguments_info} \"#{source}\"" # commands to get info from audio file
    sox_stdout_str, sox_stderr_str, sox_status = Open3.capture3(sox_command) # run the commands and wait for the result

    if sox_status.exitstatus == 0 && File.exists?(target)

    else

    end

    [info, error]
  end

end