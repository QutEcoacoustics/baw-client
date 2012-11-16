require 'yaml'
require 'net/http'
require 'json'
require 'digest'

=begin
require './lib/modules/OS'
require './lib/modules/audio_sox'
require './lib/modules/audio_wavpack'
require './lib/modules/audio_ffmpeg'
require './lib/modules/audio_mp3splt'
require './lib/modules/hash'

require './lib/modules/audio'
require './lib/modules/cache'
require './lib/exceptions'
=end

require '../modules/OS'
require '../modules/audio_sox'
require '../modules/audio_wavpack'
require '../modules/audio_ffmpeg'
require '../modules/audio_mp3splt'
require '../modules/hash'

require '../modules/audio'
require '../modules/cache'
require '../exceptions'


module OriginalAudioHarvester
  include Audio, Cache, Exceptions

  @folder_config = 'folder_config.yml'

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
  def self.directory_list(full_base_directory)
    path = File.join(full_base_directory, '*/')
    Dir[path]
  end

  # get the full path to the config file.
  def self.config_file_path(full_directory_path)
    File.join(full_directory_path, @folder_config)
  end

  # read in the yaml config file
  # get the settings from the config file
  # looks for project id and site id for now
  def self.read_config_file(config_file_path)
    raise HarvesterConfigFileNotFound, "Config file must exist." unless File.exists? config_file_path
    YAML.load_file(config_file_path)
  end

  # get the list of files in a directory, excluding the config file.
  def self.file_list(full_directory_path)
    path = File.join(full_directory_path, '*')
    Dir[path].reject { |fn| File.directory?(fn) || File.basename(fn) == @folder_config }
  end

  def self.file_info(full_file_path)
    file_info = Audio::info full_file_path
  end

  # calculate the audio recording start date and time
  def self.recording_start_datetime(full_path, utc_offset)
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

  def self.generate_hash(file_path)
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

  def self.create_params(file_path, file_info, config_file_object)
    # info we need to send, construct based on mime type

    puts file_info

    media_type = file_info[:info][:ffmpeg]['STREAM codec_type']+'/'+file_info[:info][:ffmpeg]['STREAM codec_name']
    recording_start = recording_start_datetime(file_path, config_file_object['utc_offset'])

    to_send = {
        :file_hash => 'SHA256::'+OriginalAudioHarvester.generate_hash(file_path).hexdigest,
        :sample_rate_hertz => file_info[:info][:ffmpeg]['STREAM sample_rate'],
        :media_type => media_type,
        :uploader_id => config_file_object['uploader_id'],
        :site_id => config_file_object['site_id'],
        :recorded_date => recording_start
    }

    if media_type == 'audio/wavpack'
      to_send[:bit_rate_bps] = file_info[:info][:wavpack]['ave bitrate']
      to_send[:data_length_bytes] = file_info[:info][:wavpack]['file size']
      to_send[:channels] =  file_info[:info][:wavpack]['channels']
      to_send[:duration_seconds] =  file_info[:info][:wavpack]['duration']
    else
      to_send[:bit_rate_bps] = file_info[:info][:ffmpeg]['FORMAT bit_rate']
      to_send[:data_length_bytes] =file_info[:info][:ffmpeg]['FORMAT size']
      to_send[:channels] = file_info[:info][:ffmpeg]['STREAM channels']
      to_send[:duration_seconds] = AudioFfmpeg::parse_duration(file_info[:info][:ffmpeg]['FORMAT duration'])
    end

    to_send
  end

  # get uuid for audio recording from website via REST API
  # If you post to a Ruby on Rails REST API endpoint, then you'll get an
  # InvalidAuthenticityToken exception unless you set a different
  # content type in the request headers, since any post from a form must
  # contain an authenticity token.
  def self.rails_post(endpoint, post_params)
    uri = URI.parse(endpoint)

    request = Net::HTTP::Post.new uri.path
    request.body = post_params.to_json
    request["Content-Type"] = "application/json"

    http1 = Net::HTTP.new uri.hostname, uri.port
    http1.set_debug_output $stderr

   response = http1.start() do |http|
    #  http
    #  http.request request
    http.request request
    end

    response
  end

  def self.run_once_dir(top_dir)
    # get a sub dir in the top level harvest directory (only one level deep, not recursive)
    available_dir = OriginalAudioHarvester.directory_list(top_dir).first

    # get a non-config file from the sub dir
    file_to_process = OriginalAudioHarvester.file_list(available_dir).first

    OriginalAudioHarvester.run_once_file file_to_process
  end

  def self.run_once_file(file_path)
    # get the config file in the same dir
    config_file = OriginalAudioHarvester.config_file_path(File.dirname(file_path))

    # load the config file
    config_file_object = OriginalAudioHarvester.read_config_file config_file

    # get info about the file to process
    file_info = OriginalAudioHarvester.file_info(file_path)

    # get the params to send
    to_send = OriginalAudioHarvester.create_params(file_path, file_info, config_file_object)

    post_result = rails_post('http://localhost:3000/audio_recordings.json',to_send)

    post_result
  end

end


# run the script
#topdir = File.join(Rails.root,'media','harvestwaiting')
#OriginalAudioHarvester.run_once_file '20081202-07-koala-calls.mp3'