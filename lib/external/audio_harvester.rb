require 'yaml'
require 'net/http'
require 'json'
require 'digest'
require 'logger'
require 'trollop'

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
=end



module AudioHarvester

  class Harvester
    include Audio, Cache, Exceptions, Logging

    def initialize(host, port, config_file_name, login_email, login_password, endpoint_create, endpoint_login)
      @host = host
      @port = port
      @folder_config = config_file_name
      @login_email = login_email
      @login_password = login_password
      @endpoint_create = endpoint_create
      @endpoint_login = endpoint_login
    end

=begin
  Usage:

  # e.g.
{
  file name => {
    "info" => {
      "start" => 'YYYYMMDD_HHmmss',
      "sox" => {"sox info"},
      "ffmpeg" => { "ffmpeg info" },
      "wavpack" => { "wavpack info" }
    },
    "error" => {
      "sox" => {"sox errors"},
      "ffmpeg" => { "ffmpeg errors" },
      "wavpack" => { "wavpack errors" }
    }
  },
  file name => ...
}
  result = {}
  file_lists.each do |files|
    files.each do |file|
      result[file] = OriginalAudioHarvester.file_info file
    end
  end

  # make a request to the website REST api, containing all the audio info
  # the response will contain the full file paths and the uuid for that audio recording file
  # only send info for files that are audio files

  # use the Cache module and the uuid, date, time, format to get the full path and file name

  # move the file and record success or failure

=end

    # get all directories in the top level directory
    def directory_list(full_base_directory)
      path = File.join(full_base_directory, '*/')
      dir_path = Dir[path]
      logger.debug('directory_list') { "Directoryies found: #{dir_path}" }
      dir_path
    end

    # get the full path to the config file.
    def config_file_path(full_directory_path)
      config_path = File.join(full_directory_path, @folder_config)
      logger.debug('config_file_path') { "Config file path: #{config_path}"}
      config_path
    end

    # read in the yaml config file
    # get the settings from the config file
    # looks for project id and site id for now
    def read_config_file(config_file_path)
      raise HarvesterConfigFileNotFound, "Config file must exist." unless File.exists? config_file_path
      YAML.load_file(config_file_path)
    end

    # get the list of files in a directory, excluding the config file.
    def file_list(full_directory_path)
      path = File.join(full_directory_path, '*')
      Dir[path].reject { |fn| File.directory?(fn) || File.basename(fn) == @folder_config }
    end

    def file_info(full_file_path)
      file_info = Audio::info full_file_path
    end

    # calculate the audio recording start date and time
    def recording_start_datetime(full_path, utc_offset)
      if File.exists? full_path
        access_time = File.atime full_path
        change_time = File.ctime full_path
        modified_time = File.mtime full_path

        file_name = File.basename full_path

        datetime_from_file = modified_time

        # _yyyyMMdd_HHmmss.
        file_name.scan(/.*_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\..+/) do |year, month, day, hour, min ,sec|
          datetime_from_file = DateTime.new(year.to_i, month.to_i, day.to_i, hour.to_i, min.to_i, sec.to_i, utc_offset)
        end
      end

      datetime_from_file
    end

    # constructs the full path that a file will be moved to
    def self.create_target_path(original_base_path, uuid, audio_info)

    end

    def generate_hash(file_path)
      incr_hash = Digest::SHA256.new

      File.open(file_path) do|file|
        buffer = ''

        # Read the file 512 bytes at a time
        until file.eof
          file.read(512, buffer)
          incr_hash.update(buffer)
        end
      end

      incr_hash
    end

    def create_params(file_path, file_info, config_file_object)
      # info we need to send, construct based on mime type

      #puts file_info

      media_type = file_info[:info][:ffmpeg]['STREAM codec_type']+'/'+file_info[:info][:ffmpeg]['STREAM codec_name']
      recording_start = recording_start_datetime(file_path, config_file_object['utc_offset'])

      to_send = {
          :audio_recording => {
            :file_hash => 'SHA256::'+generate_hash(file_path).hexdigest,
            :sample_rate_hertz => file_info[:info][:ffmpeg]['STREAM sample_rate'],
            :media_type => media_type,
            :uploader_id => config_file_object['uploader_id'],
            :site_id => config_file_object['site_id'],
            :recorded_date => recording_start
      }}

      if media_type == 'audio/wavpack'
        to_send[:audio_recording][:bit_rate_bps] = file_info[:info][:wavpack]['ave bitrate']
        to_send[:audio_recording][:data_length_bytes] = file_info[:info][:wavpack]['file size']
        to_send[:audio_recording][:channels] =  file_info[:info][:wavpack]['channels']
        to_send[:audio_recording][:duration_seconds] =  file_info[:info][:wavpack]['duration']
      else
        to_send[:audio_recording][:bit_rate_bps] = file_info[:info][:ffmpeg]['FORMAT bit_rate']
        to_send[:audio_recording][:data_length_bytes] =file_info[:info][:ffmpeg]['FORMAT size']
        to_send[:audio_recording][:channels] = file_info[:info][:ffmpeg]['STREAM channels']
        to_send[:audio_recording][:duration_seconds] = AudioFfmpeg::parse_duration(file_info[:info][:ffmpeg]['FORMAT duration'])
      end

      to_send
    end

    # get uuid for audio recording from website via REST API
    # If you post to a Ruby on Rails REST API endpoint, then you'll get an
    # InvalidAuthenticityToken exception unless you set a different
    # content type in the request headers, since any post from a form must
    # contain an authenticity token.
    def create_new_audiorecording(post_params)

      # set up the login HTTP post
      login_post =  Net::HTTP::Post.new(@endpoint_login)
      login_post.body = {:user => {:email => @login_email, :password => @login_password}}.to_json
      login_post["Content-Type"] = "application/json"
      puts "Login request: #{login_post.inspect}, Body: #{login_post.body}"

      res = Net::HTTP.start(@host, @port) do |http|
        login_response = http.request(login_post)
        puts "Login response: #{login_response.code}, Message: #{login_response.message}, Body: #{login_response.body}"

        if login_response.code == "200" then
          puts "logged in"

          json_resp = JSON.parse(login_response.body)
          @auth_token = json_resp['auth_token']
          post_params[:auth_token] = @auth_token

          req = Net::HTTP::Post.new(@endpoint_create)
          req.body = post_params.to_json
          req["Content-Type"] = "application/json"
          puts "Create request: #{req.inspect}, Body: #{req.body}"

          response = http.request(req)
          puts "Create response: #{response.code}, Message: #{response.message}, Body: #{response.body}"
          if response.code == "201" then
            response.body
          end
        end

      end

    end

    def run_once_dir(top_dir)
      # get a sub dir in the top level harvest directory (only one level deep, not recursive)
      available_dir = directory_list(top_dir).first

      # get a non-config file from the sub dir
      file_to_process = file_list(available_dir).first

      run_once_file file_to_process
    end

    def run_once_file(file_path)
      # get the config file in the same dir
      config_file = config_file_path(File.dirname(file_path))

      # load the config file
      config_file_object = read_config_file config_file

      # get info about the file to process
      file_info = file_info(file_path)
      Logging.logger.debug "File info '#{file_path}': '#{file_info}'"

      # get the params to send
      to_send = create_params(file_path, file_info, config_file_object)
      Logging.logger.debug "Processing file '#{file_path}', params to send '#{to_send}'"

      post_result = create_new_audiorecording(to_send)

      puts post_result.inspect
      #post_result
    end
  end

end

# command line arguments
opts = Trollop::options do
  opt :file, "A single audio file to harvest", :type => :string
  opt :config_file, "File name for folder config file.", :type => :string, :default => 'folder_config.yml'
  opt :dir, "The top-level directory containing subdirectories with audio files and config files.", :type => :string
  opt :login_email, "Email to login to web service", :type => :string
  opt :login_password, "Password to login to web service", :type => :string
end

Trollop::die :file, "a file or a directory must be given" if opts[:file].nil? && opts[:dir].nil?
Trollop::die :login_email, "must be given" if opts[:login_email].nil?
Trollop::die :login_password, "must be given" if opts[:login_password].nil?

harvester = AudioHarvester::Harvester.new(
    'localhost', 3000,
    opts[:config_file], opts[:login_email],
    opts[:login_password], '/audio_recordings.json', '/security/sign_in.json')

# run the script for a directory
# TODO

# run the script for a single file
harvester.run_once_file opts[:file]