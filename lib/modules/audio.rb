module Audio
  
  @sox_path = "./vendor/bin/sox/windows/sox.exe"
  
  @sox_arguments_info = "--info"
  @@my_logger ||= Logger.new("#{Rails.root}/log/my.log")
  
  def self.info(source)
    # sox command to create a spectrogram from an audio file
    command = "#{@sox_path} #{@sox_arguments_info} \"#{source}\""
    
    # run the command and wait for the result
    stdout_str, stderr_str, status = Open3.capture3(command)
    
    # get the audio file information from the stdout_str
    something = stdout_str.each_line { |substr| p substr.index(':') }
    
    # package up all the available information and return it
    result = [ stdout_str, stderr_str, status, File.exist?(source), something ]
    
  end
  def self.segment(source, destination)
    # sox command to create a spectrogram from an audio file
    command = "#{@sox_path} #{@sox_arguments_verbose} \"#{source}\" #{@sox_arguments_output_audio} #{@sox_arguments_sample_rate} #{@sox_arguments_spectrogram} #{@sox_arguments_output} \"#{destination}\""
    
    # run the command and wait for the result
    stdout_str, stderr_str, status = Open3.capture3(command)
    
    # package up all the available information and return it
    result = [ stdout_str, stderr_str, status, File.exist?(source), File.exist?(destination) ]
    
  end
end