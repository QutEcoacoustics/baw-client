require 'yaml'
require 'net/http'
require 'json'
require 'digest'
require 'logger'
require 'trollop'
require 'fileutils'

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
    def initialize(host, port, endpoint_media_info, endpoint_modify_audio, endpoint_analysis_results, base_dir_media, base_dir_analysis)
      @host = host
      @port = port
      @endpoint_media_info = endpoint_media_info
      @endpoint_modify_audio = endpoint_modify_audio
      @endpoint_analysis_results = endpoint_analysis_results

      # set up paths to analysis scripts and results
      SharedSettings.settings[:analysis_script_paths] = SharedSettings.settings[:analysis_script_paths].collect{ |item| File.join(base_dir_analysis, item) }
      SharedSettings.settings[:analysis_result_paths] = SharedSettings.settings[:analysis_result_paths].collect{ |item| File.join(base_dir_analysis, item) }

      # set up paths to audio and caches.
      SharedSettings.settings[:original_audio_paths] = SharedSettings.settings[:original_audio_paths].collect{ |item| File.join(base_dir_media, item) }
      SharedSettings.settings[:cached_spectrogram_paths] = SharedSettings.settings[:cached_spectrogram_paths].collect{ |item| File.join(base_dir_media, item) }
      SharedSettings.settings[:cached_audio_paths] = SharedSettings.settings[:cached_audio_paths].collect{ |item| File.join(base_dir_media, item) }
    end

    def run_once_dir(top_dir)

    end

    def run_once_file(file_path)

    end
  end
end

# command line arguments
opts = Trollop::options do
  opt :file, 'A single audio file to analyse', :type => :string
  opt :dir, 'The top-level directory containing subdirectories with analysis scripts and results.', :type => :string
  opt :analysis_script, 'Analysis script full path.', :type => :string
  opt :base_dir, 'The directory containing the folders holding the original audio and cached audio and images.', :type => :string
end

Trollop::die :file, 'a file or a directory must be given' if opts[:file].nil? && opts[:dir].nil?
Trollop::die :base_dir, 'must be given' if opts[:base_dir].nil?
Trollop::die :login_email, 'must be given' if opts[:login_email].nil?
Trollop::die :login_password, 'must be given' if opts[:login_password].nil?

analysisRunner = AnalysisRunner::Runner.new(
    'localhost', 3000, '/media/', '/media/', '/media/',
    opts[:base_dir], opts[:analysis_script])

# run the script for a directory
if opts[:dir]
  analysisRunner.run_once_dir opts[:dir]
end

# run the script for a single file
if opts[:file]
  analysisRunner.run_once_file opts[:file]
end