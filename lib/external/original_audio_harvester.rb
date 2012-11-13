require 'yaml'
require 'rest_client'

module OriginalAudioHarvester
  include Audio, Cache

  @folder_config = 'folder_config.yml'

=begin
  Usage:
  # get get all the sub dirs in the top level harvest directory (only one level deep, not recursive)
  harvest_paths = OriginalAudioHarvester.directory_list topdir

  # get the config files in each sub dir
  config_files = harvest_paths.collect {|dir| OriginalAudioHarvester.config_file_path dir }
  config_file_objects = config_files.collect { |file| OriginalAudioHarvester.read_config_file file }

  # get the other files in the sub dirs (excluding config files)
  file_lists = harvest_paths.collect {|dir| OriginalAudioHarvester.file_list dir}

  # get the information about the files into a hash
  # including calculating the recording start dates using either a recognised file name format,
  # or file accessed/modified/created date
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
  def self.recording_start_datetime(full_path)
    if File.exists? full_path
      access_time = File.atime full_path
      change_time = File.ctime full_path
      modified_time = File.mtime full_path

      file_name = File.basename full_path

      datetime_from_file = DateTime.new

      # _yyyyMMdd_HHmmss.
      file_name.scan(/.*_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\..+/) do |year,month, day, hour, min ,sec|
        #datetime_from_file = DateTime.strptime
      end
    end
  end

  # constructs the full path that a file will be moved to
  def self.create_target_path(original_base_path, uuid, audio_info)

  end

  # get uuid for audio recording from website via REST API
  def self.new_uuid()

  end

end