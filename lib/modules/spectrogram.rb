module Spectrogram
  @sox_path = "./vendor/bin/sox/windows/sox.exe"
  @sox_arguments_verbose = "-V"
  @sox_arguments_output_audio = "-n"
  @sox_arguments_sample_rate = "rate 22050"
  @sox_arguments_spectrogram = "spectrogram -m -r -l -a -q 249 -w hann -y 257 -X 43.06640625 -z 100"
  @sox_arguments_output = "-o"
  @@my_logger ||= Logger.new("#{Rails.root}/log/my.log")
  def self.generate(source, destination)
    # sox command to create a spectrogram from an audio file
    command = "#{@sox_path} #{@sox_arguments_verbose} \"#{source}\" #{@sox_arguments_output_audio} #{@sox_arguments_sample_rate} #{@sox_arguments_spectrogram} #{@sox_arguments_output} \"#{destination}\""
    # run the command and wait for the result
    stdout_str, stderr_str, status = Open3.capture3(command)
    # package up all the available information and return it
    result = [ stdout_str, stderr_str, status, File.exist?(source), File.exist?(destination) ]
  end
end