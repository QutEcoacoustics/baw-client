require 'yaml'
require 'net/http'
require 'json'
require 'digest'
require 'logger'
require 'trollop'
require 'fileutils'
require 'rubygems'
require 'zip/zip'

#=begin
require './lib/modules/OS'
require './lib/modules/audio_sox'
require './lib/modules/audio_wavpack'
require './lib/modules/audio_ffmpeg'
require './lib/modules/audio_mp3splt'
require './lib/modules/hash'
require './lib/modules/logger'
require './lib/modules/audio'
require './lib/modules/cache'
require './lib/exceptions'
require './lib/external/external_shared'
require './config/settings'
#=end

=begin
require '../modules/OS'
require '../modules/audio_sox'
require '../modules/audio_wavpack'
require '../modules/audio_ffmpeg'
require '../modules/audio_mp3splt'
require '../modules/hash'
require '../modules/logger'
require '../modules/audio'
require '../modules/cache'
require '../exceptions'
require '../../config/settings'
=end

module AnalysisRunner
  class Runner
    include ExternalShared

    # Creating a new script needs quite a few things:
    # - a name: used as the name for folders, so should only be [a-z0-9]
    # - a display name: shown to users
    # - a description: shown to users
    # - a version: used to ensure the correct script/executable is run
    # - settings: the settings a user can change, given as either command line args or in a file
    # - extra_data: the prefix for running a script (sh, ruby, r, mono, etc...)

    # once a script is created:
    # - verified: someone trusted needs to review script before they can be run, to ensure it won't do anything unwanted

    # once a script is verified
    # it is available to be selected on the website when an Analysis Job is created.
    #

    def initialize(base_dir)
      read_config(base_dir)
    end

    def run_once(script_name, script_version, script_content, script_file, script_settings, audio_full_paths)
      # needs script information: name, version, settings
      # needs location of top level directory for analysis runs

      # create the analysis run path
      script_run_base = File.join(SharedSettings.settings[:analysis_run_path],script_name.to_s+'_'+script_version.to_s)
      FileUtils.makedirs(script_run_base)

      # create a temp file just for the file name, delete it straight away
      begin
        tmpfile = Tempfile.new(script_name, script_run_base)
        script_run_file = tmpfile.path
      ensure
        tmpfile.close
        tmpfile.unlink
      end

      # get the script content into the file to execute
      if script_content
        File.open(script_run_file, 'w') do |file|
          file.write(script_content)
        end
      else
        FileUtils.copy(script_file, script_run_file)
      end

      # if audio files are provided, copy them into the directory


      # run the script
      script_command = "#{script_run_file} #{script_settings}"
      script_stdout_str, script_stderr_str, script_status = Open3.capture3(script_command)
      logger.debug "Script return status #{script_status.exitstatus}. Command: #{script_command}"

      # delete the audio files that were copied into the run directory


      # create a zip file in each result path with the contents of the analysis run folder
      SharedSettings.settings[:analysis_result_paths].each do |dest_path|
        create_zip(dest_path, script_run_base, Dir.entries(script_run_base))
      end


      # optional: paths to audio files to analyse. These come from a dataset or saved search.
      # audio_full_paths
      script_name
    end

    def copy_content(source_file, dest_file_handle)
      File.open(source_file) do |source|
        buffer = ''

        # Read the file 512 bytes at a time
        until file.eof
          source.read(512, buffer)
          dest_file_handle.write(buffer)
        end
      end
    end

    def create_zip(dest_file, input_base_path, input_filenames)
      Zip::ZipFile.open(dest_file, Zip::ZipFile::CREATE) do |zipfile|
        input_filenames.each do |filename|
          # Two arguments:
          # - The name of the file as it will appear in the archive
          # - The original file, including the path to find it
          zipfile.add(filename, File.join(input_base_path, filename))
        end
      end
    end
  end
end

# command line arguments
opts = Trollop::options do
  opt :base_dir, 'The directory containing the folders holding the original audio and cached audio and images.', :type => :string
  opt :script_name, 'The internal name of the script.', :type => :string
  opt :script_version, 'The version of the script to execute.', :type => :string
  opt :script_content, 'The actual script content that will be executed.', :type => :string
  opt :script_file, 'A file containing the script to be executed.', :type => :string
  opt :script_settings, 'An arbitrary string that is sent to the script when executed.', :type => :string
  opt :audio_paths, 'Full paths to the audio file to be analysed. The files should already be prepared.', :type => :strings
end

Trollop::die :base_dir, 'must be given' if opts[:base_dir].nil?
Trollop::die :script_name, 'must be given' if opts[:script_name].nil?
Trollop::die :script_version, 'must be given' if opts[:script_version].nil?

if (opts[:script_content].nil? && opts[:script_file].nil?) || (!opts[:script_content].nil? && !opts[:script_file].nil?)
  Trollop::die :script_content, 'give only one of script content or script file'
end

analysis_runner = AnalysisRunner::Runner.new(opts[:base_dir])

# run the script for one analysis run
analysis_runner.run_once(opts[:script_name], opts[:script_version], opts[:script_content], opts[:script_file], opts[:script_settings], opts[:audio_paths])
