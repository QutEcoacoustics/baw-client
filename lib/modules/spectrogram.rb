require 'OS'
require 'open3'

module Spectrogram
  @sox_path = if OS.windows? then "./vendor/bin/sox/windows/sox.exe" else "sox" end
  @sox_arguments_verbose = "-V"
  @sox_arguments_output_audio = "-n"
  @sox_arguments_sample_rate = "rate 22050"
  @sox_arguments_spectrogram = "spectrogram -m -r -l -a -q 249 -w hann -y 257 -X 43.06640625 -z 100"
  @sox_arguments_output = "-o"
  
  # Generate a spectrogram image from an audio file.
  # The spectrogram will be 257 pixels high, but the length is not known exactly beforehand.
  # The spectrogram will be created for the entire file. Durations longer than 2 minutes are not recommended.
  # Source is the audio file, target is the image file that will be created.
  # An existing image file will not be overwritten.
  # possible parameters: :window :colour :format
  def self.generate(source, target, modify_parameters)
    
    # check for existing image, and do not overwrite
    if File.exist?(target)
      Rails.logger.warn  "Target path for spectrogram generation already exists: #{target}."
      return [ "", "", "", source, File.exist?(source), target, File.exist?(target) ]
    end
  
    # sox command to create a spectrogram from an audio file
    command = "#@sox_path #@sox_arguments_verbose \"#{source}\" #@sox_arguments_output_audio #@sox_arguments_sample_rate #@sox_arguments_spectrogram #@sox_arguments_output \"#{target}\""
    
    # run the command and wait for the result
    stdout_str, stderr_str, status = Open3.capture3(command)
    
    # log the command
    Rails.logger.debug "Spectrogram generation return status #{status.exitstatus}. Command: #{command}"
    
    # package up all the available information and return it
    result = [ stdout_str, stderr_str, status, source, File.exist?(source), target, File.exist?(target) ]
  end
end