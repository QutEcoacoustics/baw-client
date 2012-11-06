class MediaController < ApplicationController
  include FileCacher

  respond_to :xml, :json, :html, :png, :ogg, :oga, :webm, :webma, :mp3

  def index
    # index page for media files
    #@testing = QubarSite::Application.config.media_file_config
  end

  def item
    # controller action for an individual media file

    # construct a hash of information to be returned and used for modify_parameters
    @file_info = params
    #@file_info.delete 'controller'
    #@file_info.delete 'action'
    #@file_info.delete 'format'

    # decide on the format requested. There are at least two ways to get the request format:
    # request.format (created based on accept mime type) and params[:format] (from the file extension in the request)

    requested_media_type = Mime[request.format]
    requested_extension = params[:format]

    final_format_requested = requested_media_type

    image_media_types = [ Mime['image/png'] ]
    audio_media_types = [ Mime['audio/webm'], Mime['audio/webma'],
                          Mime['audio/ogg'], Mime['audio/oga'],
                          Mime['audio/mp3'], Mime['audio/mpeg'] ]
    text_media_types = [ Mime['application/json'], Mime['text/html'],
                         Mime['application/xhtml+xml'], Mime['application/xml'],
                         Mime['application/x-javascript'], Mime['text/javascript'],
                         Mime['text/x-javascript'],Mime['text/x-json'] ]

    # if the format is a supported image format, locate a cached spectrogram or generate it, then stream it back.
    #if image_media_types.include? final_format_requested

    recording = AudioRecording.find_by_uuid(@file_info[:id])
    @file_info[:date] = recording.recorded_date.strftime "%Y%m%d"
    @file_info[:time] = recording.recorded_date.strftime "%H%M%S"

    full_path = FileCacher::generate_spectrogram @file_info
      send_file full_path, :stream => true, :buffer_size => 4096, :disposition => 'inline', :type => final_format_requested, :content_type => final_format_requested



=begin
    elsif audio_media_types.include? final_format_requested
      full_path = FileCacher::create_audio_segment @file_info
      send_file full_path, :stream => true, :buffer_size => 4096, :disposition => 'inline', :type => final_format_requested, :content_type => final_format_requested

    elsif text_media_types.include? final_format_requested
      respond_with @file_info

    else
      # respond with a bad request
      respond_with nil, { :head => :bad_request }
    end
=end
  end

  def update
    # this action checks for new original audio recordings, and adds their information to the database

    # this is not practical for production due to the huge number of files, but can be used for development
    return head(:bad_request) unless Rails.env == 'development'

    # iterate through all original audio folders, and check that the audio recordings there are in the database
    Dir.glob("#{dir}/*").each_with_object({}) { |file, hash|  }


  end

  private

  def read_dir(dir)
    # from http://stackoverflow.com/questions/6166103/traversing-directories-and-reading-from-files-in-ruby-on-rails
    Dir.glob("#{dir}/*").each_with_object({}) do |f, h|
      if File.file?(f)
        h[f] = open(f).read
      elsif File.directory?(f)
        h[f] = read_dir(f)
      end
    end
  end
end

module Mime
  class Type
    class << self
      # Lookup, guesstimate if fail, the file extension
      # for a given mime string. For example:
      #
      # >> Mime::Type.file_extension_of 'text/rss+xml'
      # => "xml"
      def file_extension_of(mime_string)
        set = Mime::LOOKUP[mime_string]
        sym = set.instance_variable_get("@symbol") if set
        return sym.to_s if sym
        return $1 if mime_string =~ /(\w+)$/
      end
    end
  end
end