require 'open3'

module Spectrogram
  include OS

  @sox_path = if OS.windows? then "./vendor/bin/sox/windows/sox.exe" else "sox" end
  @sox_arguments_immutable = '-n '
  @sox_arguments_verbose = "-V"
  @sox_arguments_output_audio = "-n"
  @sox_arguments_sample_rate = "rate 22050"
  @sox_arguments_spectrogram = "spectrogram -m -r -l -a -q 249 -w hann -y 257 -X 43.06640625 -z 100"
  @sox_arguments_output = "-o"

  def self.colour_options()
    { :g => :greyscale }
  end

  def self.window_options()
    [ 128, 256, 512, 1024, 2048, 4096 ]
  end

  # Generate a spectrogram image from an audio file.
  # The spectrogram will be 257 pixels high, but the length is not known exactly beforehand.
  # The spectrogram will be created for the entire file. Durations longer than 2 minutes are not recommended.
  # Source is the audio file, target is the image file that will be created.
  # An existing image file will not be overwritten.
  # possible parameters: :window :colour :format
  def self.generate(source, target, modify_parameters)
    raise ArgumentError, "Target path for spectrogram generation already exists: #{target}." unless !File.exist?(target)
    raise ArgumentError, "Window size must be one of ''#{window_options.join(', ')}', given '#{modify_parameters[:window]}'." unless window_options.include? modify_parameters[:window].to_i

    colours_available = colour_options.map { |k, v| "#{k} (#{v})" }.join(', ')
    raise ArgumentError, "Colour must be one of '#{colours_available}', given '#{modify_parameters[:colour]}'." unless colour_options.include? modify_parameters[:colour]




    # sox command to create a spectrogram from an audio file
    command = "#@sox_path -V \"#{source}\" -n #@sox_arguments_sample_rate spectrogram -r -l -a #@sox_arguments_output \"#{target}\""
    
    # run the command and wait for the result
    stdout_str, stderr_str, status = Open3.capture3(command)
    
    # log the command
    Rails.logger.debug "Spectrogram generation return status #{status.exitstatus}. Command: #{command}"

    # check for source file problems
    raise ArgumentError, "Source file was not a valid audio file: #{source}." if stderr_str.include? 'FAIL formats: can\'t open input file'

    # package up all the available information and return it
    result = [ stdout_str, stderr_str, status, source, File.exist?(source), target, File.exist?(target) ]
  end
end