module AudioSox
include OS
  @sox_path = if OS.windows? then "./vendor/bin/sox/windows/sox.exe" else "sox" end

  # public methods
  public

  def self.info_sox(source)
    result = {
        :info => { :sox => {} },
        :error => { :sox => {} }
    }

    sox_arguments_info = "--info"
    sox_command = "#@sox_path #{sox_arguments_info} \"#{source}\"" # commands to get info from audio file
    sox_stdout_str, sox_stderr_str, sox_status = Open3.capture3(sox_command) # run the commands and wait for the result


    puts "sox info return status #{sox_status.exitstatus}. Command: #{sox_command}"

    #Rails.logger.debug "mp3splt info return status #{sox_status.exitstatus}. Command: #{sox_command}"

    if sox_status.exitstatus == 0
      # sox std out contains info (separate on first colon(:))
      sox_stdout_str.strip.split(/\r?\n|\r/).each { |line| result[:info][:sox][ line[0,line.index(':')].strip] = line[line.index(':')+1,line.length].strip  }
      # sox_stderr_str is empty
    else
      #Rails.logger.debug "Sox info error. Return status #{sox_status.exitstatus}. Command: #{sox_command}"
      result[:error][:sox][:stderror] = sox_stderr_str
    end

    result
  end

  def self.modify_sox(source, target, modify_parameters = {})
    raise ArgumentError, "Source is not a mp3 or wav file: #{File.basename(source)}" unless source.match(/\.mp3|\.wav$/)
    raise ArgumentError, "Target is not a mp3 or wav file: : #{File.basename(target)}" unless target.match(/\.mp3|\.wav$/)
    raise ArgumentError, "Source does not exist: #{File.basename(source)}" unless File.exists? source
    raise ArgumentError, "Target exists: #{File.basename(target)}" unless !File.exists? target

    result = {}

    # order matters!
    arguments = ''

    # start and end offset
    if modify_parameters.include? :start_offset
      start_offset_formatted = Time.at(modify_parameters[:start_offset]).utc.strftime('%H:%M:%S.%2N')
      arguments += "trim =#{start_offset_formatted}"
    end

    if modify_parameters.include? :end_offset
      end_offset_formatted = Time.at(modify_parameters[:end_offset]).utc.strftime('%H:%M:%S.%2N')
      if modify_parameters.include? :start_offset
        arguments += " =#{end_offset_formatted}"
      else
        # if start offset was not included, include audio from the start of the file.
        arguments += "trim 0 #{end_offset_formatted}"
      end
    end

    # resample quality: medium (m), high (h), veryhigh (v)
    if modify_parameters.include? :sample_rate
      arguments += " rate -v -s -a #{modify_parameters[:sample_rate]}"
    end

=begin
      Where a range of channels is specified, the channel numbers to the left and right of the hyphen are
      optional and default to 1 and to the number of input channels respectively. Thus
      sox input.wav output.wav remix −
      performs a mix-down of all input channels to mono.
=end
    if modify_parameters.include? :channel
      # help... not sure how to do this
      arguments +=  ""
    end

    sox_command = "#@sox_path -V4 \"#{source}\" \"#{target}\" #{arguments}" # commands to get info from audio file
    sox_stdout_str, sox_stderr_str, sox_status = Open3.capture3(sox_command) # run the commands and wait for the result

    puts "Sox command #{sox_command}"

    if sox_status.exitstatus != 0 || !File.exists?(target)
      raise "Sox exited with an error: #{sox_stderr_str}"
    end

    result
  end

end