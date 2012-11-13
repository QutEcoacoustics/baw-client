require './lib/external/original_audio_harvester'

class HomeController < ApplicationController
  include OriginalAudioHarvester

  def index
=begin
    topdir = File.join(Rails.root,'media','harvestwaiting')

    harvest_paths = OriginalAudioHarvester.directory_list topdir
    config_files = harvest_paths.collect {|dir| OriginalAudioHarvester.config_file_path dir }
    file_lists = harvest_paths.collect {|dir| OriginalAudioHarvester.file_list dir}

    config_file_objects = config_files.collect { |file| OriginalAudioHarvester.read_config_file file }

    result = {}

    file_lists.each do |files|
      files.each do |file|
        result[file] = OriginalAudioHarvester.file_info file
      end
    end

    params[:testing] = result


    raise RuntimeError
=end
  end
end
