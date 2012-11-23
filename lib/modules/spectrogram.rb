require 'open3'
require 'OS'

module Spectrogram
  include OS

  @sox_path = if OS.windows? then "./vendor/bin/sox/windows/sox.exe" else "sox" end
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

    # sample rate
    sample_rate_param = modify_parameters.include?(:sample_rate) ? modify_parameters[:sample_rate].to_i : 11025

    # window size
    all_window_options = window_options.join(', ')
    window_param = modify_parameters.include?(:window) ? modify_parameters[:window].to_i : 512
    raise ArgumentError, "Window size must be one of '#{all_window_options}', given '#{window_param}'." unless window_options.include? window_param

    # window size must be one more than a power of two, see sox documentation http://sox.sourceforge.net/sox.html
    window_param = (window_param / 2) + 1
    window_settings = ' -y '+window_param.to_s

    # colours
    colours_available = colour_options.map { |k, v| "#{k} (#{v})" }.join(', ')
    colour_param = modify_parameters.include?(:colour) ? modify_parameters[:colour] : 'g'
    raise ArgumentError, "Colour must be one of '#{colours_available}', given '#{}'." unless colour_options.include? colour_param.to_sym
    colour_settings = ' -m -q 249 -z 100'


    # sox command to create a spectrogram from an audio file
    # -V is for verbose
    # -n indicates no output audio file
    spectrogram_settings = 'spectrogram -r -l -a -w Hamming -X 43.06640625' + colour_settings + window_settings
    command = "#@sox_path -V \"#{source}\" -n rate #{sample_rate_param} #{spectrogram_settings}  #@sox_arguments_output \"#{target}\""
    
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